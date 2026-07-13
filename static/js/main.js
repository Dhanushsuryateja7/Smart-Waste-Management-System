document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const cameraBtn = document.getElementById('camera-btn');
    const loading = document.getElementById('loading');
    const resultSection = document.getElementById('result-section');
    const previewImg = document.getElementById('preview-img');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const cameraContainer = document.getElementById('camera-container');

    const loginModal = document.getElementById('login-modal');
    const showLoginBtn = document.getElementById('show-login');
    const closeLoginBtn = document.getElementById('close-login');
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');

    // Check if redirecting from other pages requests showing the login modal
    if (window.location.search.includes('login=true') || window.location.hash === '#login') {
        if (loginModal) {
            loginModal.style.display = 'flex';
        }
    }

    // -- Authentication --
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
        });
    }

    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-user').value;
            const password = document.getElementById('login-pass').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (data.success) {
                    location.reload();
                } else {
                    const errEl = document.getElementById('login-error');
                    if (errEl) { errEl.textContent = data.message; errEl.style.display = 'block'; }
                }
            } catch (err) {
                const errEl = document.getElementById('login-error');
                if (errEl) { errEl.textContent = 'Login failed. Try again.'; errEl.style.display = 'block'; }
            }
        });
    }

    // -- Sign Up --
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-user').value.trim();
            const password = document.getElementById('signup-pass').value;
            const confirm  = document.getElementById('signup-confirm').value;
            const msgEl    = document.getElementById('signup-msg');
            msgEl.style.display = 'none';
            if (!username || !password) {
                msgEl.textContent = 'Please fill in all fields.';
                msgEl.style.display = 'block'; return;
            }
            if (password !== confirm) {
                msgEl.textContent = 'Passwords do not match.';
                msgEl.style.display = 'block'; return;
            }
            try {
                const res = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (data.success) {
                    location.reload();
                } else {
                    msgEl.textContent = data.message;
                    msgEl.style.color = '#ef4444';
                    msgEl.style.display = 'block';
                }
            } catch (err) {
                msgEl.textContent = 'Registration failed. Try again.';
                msgEl.style.display = 'block';
            }
        });
    }

    // -- File Upload Logic (only when user is logged in) --
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            classifyImage(file);
        };
        reader.readAsDataURL(file);
    }

    // -- Camera Capture Logic (only when user is logged in) --
    if (cameraBtn) {
        cameraBtn.addEventListener('click', async () => {
            try {
                if (cameraBtn.innerText.includes('Capture Live')) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    video.srcObject = stream;

                    // Move camera container inside the classifier area after the drop zone
                    const classifierMain = dropZone.closest('main') || dropZone.parentNode;
                    classifierMain.insertBefore(cameraContainer, loading);
                    cameraContainer.style.display = 'block';

                    dropZone.style.display = 'none';
                    cameraBtn.innerHTML = '<i class="fas fa-camera"></i> Capture Frame';
                } else {
                    // Capture frame to canvas
                    const context = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const dataUrl = canvas.toDataURL('image/jpeg');
                    previewImg.src = dataUrl;

                    // Stop stream
                    const stream = video.srcObject;
                    if (stream) stream.getTracks().forEach(track => track.stop());
                    video.srcObject = null;
                    cameraContainer.style.display = 'none';
                    dropZone.style.display = 'block';
                    cameraBtn.innerHTML = '<i class="fas fa-camera"></i> Capture Live';

                    // Send base64 data to backend
                    classifyImageBase64(dataUrl);
                }
            } catch (err) {
                console.error("Camera error:", err);
                alert("Could not access camera. Please check permissions.");
            }
        });
    }

    // -- API Call (File Upload) --
    async function classifyImage(file) {
        loading.style.display = 'block';
        resultSection.style.display = 'none';

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/classify', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.error) {
                alert('Classification failed: ' + data.error);
            } else {
                displayResult(data);
                fetchHistory();
                if (typeof loadDashboardStats === 'function') { loadDashboardStats(); }
            }
        } catch (err) {
            console.error('API Error:', err);
            alert('An error occurred while connecting to the server.');
        } finally {
            loading.style.display = 'none';
        }
    }

    // -- API Call (Base64 Camera Capture) --
    async function classifyImageBase64(dataUrl) {
        loading.style.display = 'block';
        resultSection.style.display = 'none';

        const formData = new FormData();
        formData.append('image_data', dataUrl);

        try {
            const response = await fetch('/classify', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.error) {
                alert('Classification failed: ' + data.error);
            } else {
                displayResult(data);
                fetchHistory();
                if (typeof loadDashboardStats === 'function') { loadDashboardStats(); }
            }
        } catch (err) {
            console.error('API Error:', err);
            alert('An error occurred while connecting to the server.');
        } finally {
            loading.style.display = 'none';
        }
    }

    function displayResult(data) {
        document.getElementById('res-category').innerText = data.category;
        document.getElementById('res-confidence').innerText = data.confidence;
        
        const confidenceVal = parseFloat(data.confidence);
        const fill = document.getElementById('confidence-fill');
        fill.style.width = '0%';
        setTimeout(() => {
            fill.style.width = data.confidence;
        }, 100);

        document.getElementById('res-method').innerText = data.instructions.recycling_method;
        document.getElementById('res-tip').innerText = data.instructions.disposal_tip;
        document.getElementById('res-impact').innerText = data.instructions.environmental_impact;

        // Show badge
        const badge = document.getElementById('res-badge');
        if (data.demo_mode) {
            badge.innerText = `⚠ DEMO — ${data.category}`;
            badge.style.background = '#fef3c7';
            badge.style.color = '#92400e';
        } else {
            badge.innerText = data.category;
            badge.style.background = '';
            badge.style.color = '';
        }
        badge.style.display = 'inline-block';

        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    // -- History Logging --
    async function fetchHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            const body = document.getElementById('history-body');
            
            if (!body) return;

            body.innerHTML = '';
            if (data.length === 0) {
                body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No scans performed yet. Start scanning to see logs!</td></tr>';
                return;
            }

            data.forEach(item => {
                const row = `
                    <tr>
                        <td style="font-weight:700;">${item.id}</td>
                        <td class="text-muted">${item.location}</td>
                        <td>${item.material}</td>
                        <td style="color:var(--primary); font-weight:700;">${item.confidence}</td>
                        <td class="text-muted">${item.timestamp}</td>
                        <td><span class="status-badge status-valid">${item.status}</span></td>
                    </tr>
                `;
                body.innerHTML += row;
            });
        } catch (err) {
            console.error('History fetch error:', err);
        }
    }

    // Initial load
    fetchHistory();
    initGlobe();

    // -- 3D Globe Animation (Three.js) --
    function initGlobe() {
        const container = document.getElementById('globe-3d');
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Core Sphere
        const geometry = new THREE.SphereGeometry(2, 64, 64);
        
        // Realistic Organic Texture (Sustainable Earth)
        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load('/static/images/earth_texture.png');
        
        const material = new THREE.MeshPhongMaterial({
            map: earthTexture,
            shininess: 5,
            bumpMap: earthTexture,
            bumpScale: 0.05
        });

        const globe = new THREE.Mesh(geometry, material);
        scene.add(globe);

        // Atmosphere Glow
        const atmosphereGeo = new THREE.SphereGeometry(2.1, 64, 64);
        const atmosphereMat = new THREE.MeshPhongMaterial({
            color: 0x10b981,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
        scene.add(atmosphere);

        // Inner core (optional darkening)
        const innerGeo = new THREE.SphereGeometry(1.98, 64, 64);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0x011627 });
        const innerGlobe = new THREE.Mesh(innerGeo, innerMat);
        scene.add(innerGlobe);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        camera.position.z = 5;

        // Interactive mouse rotation variables
        let isDragging = false;
        let previousMouseX = 0;
        let previousMouseY = 0;

        container.addEventListener('mousedown', (e) => { isDragging = true; });
        window.addEventListener('mouseup', () => { isDragging = false; });
        
        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMouseX;
                const deltaY = e.clientY - previousMouseY;
                globe.rotation.y += deltaX * 0.01;
                globe.rotation.x += deltaY * 0.01;
                innerGlobe.rotation.y += deltaX * 0.01;
            }
            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
        });

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Auto rotation
            if (!isDragging) {
                globe.rotation.y += 0.003;
                innerGlobe.rotation.y += 0.001;
            }
            
            renderer.render(scene, camera);
        }

        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }
});

// -- Tab switcher (global, called from HTML onclick) --
function switchAuthTab(tab) {
    const formLogin  = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    const tabLogin   = document.getElementById('tab-login');
    const tabSignup  = document.getElementById('tab-signup');

    if (tab === 'login') {
        formLogin.style.display  = 'block';
        formSignup.style.display = 'none';
        tabLogin.style.color     = 'var(--primary)';
        tabLogin.style.borderBottomColor  = 'var(--primary)';
        tabSignup.style.color    = 'var(--text-muted)';
        tabSignup.style.borderBottomColor = 'transparent';
    } else {
        formLogin.style.display  = 'none';
        formSignup.style.display = 'block';
        tabSignup.style.color    = 'var(--primary)';
        tabSignup.style.borderBottomColor  = 'var(--primary)';
        tabLogin.style.color     = 'var(--text-muted)';
        tabLogin.style.borderBottomColor   = 'transparent';
    }
}
