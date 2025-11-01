const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3.5;

const geometry = new THREE.BoxGeometry(1, 1, 1);

// Define RGBShiftShader manually since CDN may not work
const RGBShiftShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'amount': { value: 0.005 },
        'angle': { value: 0.0 }
    },
    vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
    fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                uniform float angle;
                varying vec2 vUv;
                
                void main() {
                    vec2 offset = amount * vec2(cos(angle), sin(angle));
                    vec4 cr = texture2D(tDiffuse, vUv + offset);
                    vec4 cga = texture2D(tDiffuse, vUv);
                    vec4 cb = texture2D(tDiffuse, vUv - offset);
                    gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
                }
            `
};



// const material = new THREE.MeshBasicMaterial({ color: "red" });
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

const loader = new THREE.GLTFLoader();

// loader.load(
//     'DamagedHelmet.gltf',
//     function (gltf) {
//         object = gltf.scene;
//         scene.add(object);
//         console.log('Damaged Helmet Loaded');
//     },
//     function (xhr) {
//         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//     },
//     function (error) {
//         console.error(error);
//     }
// );

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor("black"); // same as rgb(24,24,26)


const composer = new THREE.EffectComposer(renderer);
const renderpass = new THREE.RenderPass(scene, camera);
composer.addPass(renderpass);

const rgbShiftPass = new THREE.ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0035;
composer.addPass(rgbShiftPass);

const pmremGenerator = new THREE.PMREMGenerator(renderer);

let model;

new THREE.RGBELoader()
    .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', function (texture) {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        // scene.background = envMap;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();

        const loader = new THREE.GLTFLoader();
        loader.load(
            'DamagedHelmet.gltf', (gltf) => {
                model = gltf.scene;
                scene.add(gltf.scene)
            }, undefined, (error) => {
                console.error("An error occured while laoding the GLTF model:", error)
            }
        )
    });

window.addEventListener('resize', onWindowResize);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("mousemove", (e) => {
    if (model) {
        const rotationX = (e.clientX/window.innerWidth - .5) * (Math.PI * 0.3);
        const rotationY = (e.clientY/window.innerHeight - .5) * (Math.PI * 0.3);
        gsap.to(model.rotation,{
            x: rotationY,
            y: rotationX,
            duration: 0.5,
            ease: "power2.out"
        })

    }
})


function animate() {
    requestAnimationFrame(animate);
    // mesh.rotation.x += 0.01;
    // mesh.rotation.y += 0.01;
    // mesh.rotation.z += 0.01;
    
    // renderer.render(scene, camera);
    composer.render();

}

animate();