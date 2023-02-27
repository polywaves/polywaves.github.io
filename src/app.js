import * as THREE from 'three'
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Sky } from 'three/examples/jsm/objects/Sky'
import { Reflector } from 'three/examples/jsm/objects/Reflector'


class App {
    constructor () {
        // Defaults
        this.modelsPath = 'models/door/'

        // Three
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            // powerPreference: 'high-performance'
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.autoClear = false
        document.body.appendChild(this.renderer.domElement)

        // Loading manager
        this.manager = new THREE.LoadingManager()
        this.manager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading file: ${url}`)
            console.log(`Loaded ${itemsLoaded} of ${itemsTotal} files.`)
        }

        this.manager.onLoad = () => {
            console.log(`Loading complete!`)
        }

        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading file: ${url}`)
            console.log(`Loaded ${itemsLoaded} of ${itemsTotal} files.`)
        }

        this.manager.onError = (url) => {
            console.error(`There was an error loading ${url}`)
        }

        // loaders
        this.objLoader = new OBJLoader(this.manager)
        this.mtlLoader = new MTLLoader(this.manager)

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.addEventListener('change', this.renderer)
        this.controls.minDistance = 100
        this.controls.maxDistance = 1000
    }
}

(async () => {
    const app = new App()

    app.resize = () => {
        app.camera.aspect = window.innerWidth / window.innerHeight
        app.camera.updateProjectionMatrix()
        app.renderer.setSize(window.innerWidth, window.innerHeight)

        app.verticalMirror.getRenderTarget().setSize(
            window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio
        )
    }

    app.build = async () => {
        // Defaults
        app.camera.position.z = 140

        // Skybox
        app.sky = new Sky()
        app.sky.scale.setScalar(450000)
        app.scene.add(app.sky)

        // Sun defs
        app.sun = new THREE.Vector3()
        app.uniforms = app.sky.material.uniforms
        app.uniforms['turbidity'].value = 11
        app.uniforms['rayleigh'].value = 3.6
        app.uniforms['mieCoefficient'].value = 0.01
        app.uniforms['mieDirectionalG'].value = 0.5
        app.phi = THREE.MathUtils.degToRad(90 - 1.5 )
        app.theta = THREE.MathUtils.degToRad(0)
        app.sun.setFromSphericalCoords(1, app.phi, app.theta)
        app.uniforms['sunPosition'].value.copy(app.sun)

        // Plane
        app.geometry = new THREE.PlaneGeometry(1000, 1000)
        app.material = new THREE.MeshLambertMaterial({
            color: 0x808080
        })

        app.mesh = new THREE.Mesh(app.geometry, app.material)
        app.mesh.position.set( 0, -45, 0)
        app.mesh.rotation.x = - Math.PI / 2
        app.mesh.castShadow = true
        app.mesh.receiveShadow = true
        app.scene.add(app.mesh)

        // Lights
        app.ambient = new THREE.AmbientLight( 0xffffff )
        app.scene.add(app.ambient)

        app.spotLight = new THREE.SpotLight(0xffffff, 3)
        app.spotLight.position.set(25, 100, 25)
        app.spotLight.angle = Math.PI / 5
        app.spotLight.penumbra = 0.5
        app.spotLight.decay = 2
        app.spotLight.distance = 300
        app.spotLight.castShadow = true
        app.spotLight.shadow.mapSize.width = 1024
        app.spotLight.shadow.mapSize.height = 1024
        app.spotLight.shadow.camera.near = 8
        app.spotLight.shadow.camera.far = 300
        app.spotLight.shadow.focus = 1
        app.scene.add(app.spotLight)

        app.lightHelper = new THREE.SpotLightHelper(app.spotLight)
        // app.scene.add(app.lightHelper)

        // Door
        app.materialsCreator = await app.mtlLoader.loadAsync(`${app.modelsPath}Shaker door 1.mtl`)
        app.objLoader.setMaterials(app.materialsCreator)

        app.door = await app.objLoader.loadAsync(`${app.modelsPath}Shaker door 1.obj`)
        app.door.position.set(0, -45, 0)
        app.door.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })
        app.scene.add(app.door)

        // Reflection mesh
        app.geometry = new THREE.PlaneGeometry( 1000 , 400)
        app.verticalMirror = new Reflector( app.geometry, {
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0x889999
        })
        app.verticalMirror.position.y = 150
        app.verticalMirror.position.z = -200
        app.scene.add(app.verticalMirror)

        // Spheres
        app.sphereGroup = new THREE.Object3D()
        app.sphereGroup.position.y = -40
        app.sphereGroup.position.x = 70
        app.sphereGroup.position.z = 40
        app.scene.add(app.sphereGroup)

        app.geometry = new THREE.CylinderGeometry(
            0.1,
            15 * Math.cos( Math.PI / 180 * 30 ),
            0.1,
            24,
            1
        )
        app.material = new THREE.MeshPhongMaterial( {
            color: 0xffffff,
            emissive: 0x444444
        })
        app.sphereCap = new THREE.Mesh(app.geometry, app.material)
        app.sphereCap.position.y = - 15 * Math.sin(Math.PI / 180 * 30) - 0.05
        app.sphereCap.rotateX(-Math.PI)

        app.geometry = new THREE.SphereGeometry(
            15,
            24,
            24,
            Math.PI / 2,
            Math.PI * 2,
            0,
            Math.PI / 180 * 120
        )
        app.halfSphere = new THREE.Mesh(app.geometry, app.material)
        app.halfSphere.add(app.sphereCap)
        app.halfSphere.rotateX(- Math.PI / 180 * 135)
        app.halfSphere.rotateZ(- Math.PI / 180 * 20)
        app.halfSphere.position.y = 10
        app.halfSphere.castShadow = true
        app.halfSphere.receiveShadow = true
        app.sphereGroup.add(app.halfSphere)

        app.geometry = new THREE.IcosahedronGeometry( 5, 0 )
        app.material = new THREE.MeshPhongMaterial( {
            color: 0xffffff,
            emissive: 0x333333,
            flatShading: true
        })
        app.smallSphere = new THREE.Mesh(app.geometry, app.material)
        app.smallSphere.castShadow = true
        app.smallSphere.receiveShadow = true
        app.sphereGroup.add(app.smallSphere)
    }

    app.animate = () => {
        requestAnimationFrame(app.animate)

        // Animate scene objects
        // app.door.rotation.y += 0.001
        const time = performance.now() / 3000
        app.spotLight.position.x = Math.cos(time) * 50
        app.spotLight.position.z = Math.sin(time) * 50

        const timer = Date.now() * 0.01
        app.sphereGroup.rotation.y -= 0.002
        app.smallSphere.position.set(
            Math.cos(timer * 0.1) * 30,
            Math.abs(Math.cos(timer * 0.2) ) * 20,
            Math.sin(timer * 0.1) * 30
        )
        app.smallSphere.rotation.y = (Math.PI / 2) - timer * 0.1
        app.smallSphere.rotation.z = timer * 0.8

        app.renderer.render(app.scene, app.camera)
    }


    // Scene build
    await app.build()
    app.animate()
    app.resize()
    window.onresize = app.resize
})()