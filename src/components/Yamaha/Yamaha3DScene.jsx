import React, { Suspense, forwardRef, useImperativeHandle, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinnedScene } from 'three/addons/utils/SkeletonUtils.js';

const MODEL_URL = '/models/yamaha_yzf_2021.glb';

function LoadingMark() {
  return <Html center><span className="scene-loader" aria-label="Loading motorcycle model" /></Html>;
}

function MotorcycleModel({ color, focus, onCapabilities, motorcycleRef }) {
  const gltf = useGLTF(MODEL_URL);
  const group = useRef();
  const model = React.useMemo(() => {
    const clone = cloneSkinnedScene(gltf.scene);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 5.2 / Math.max(size.x, size.y, size.z, 0.001);
    clone.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    clone.scale.setScalar(scale);
    clone.traverse((object) => { if (object.isMesh) { object.castShadow = false; object.receiveShadow = false; } });
    return clone;
  }, [gltf.scene]);
  const originalLights = useRef(new WeakMap());
  React.useEffect(() => {
    const materials = [];
    gltf.scene.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      const list = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach((material) => {
        if (material?.color && /body|tank|fairing|paint/i.test(`${object.name} ${material.name}`)) materials.push(material);
      });
    });
    onCapabilities?.({ recolorable: materials.length > 0, applyColor: (hex) => materials.forEach((m) => m.color.set(hex)) });
    return () => onCapabilities?.({ recolorable: false, applyColor: null });
  }, [gltf.scene, onCapabilities]);
  React.useEffect(() => {
    if (color && group.current) {
      group.current.traverse((object) => {
        if (object.isMesh && /body|tank|fairing|paint/i.test(`${object.name} ${object.material?.name}`)) object.material.color.set(color);
      });
    }
  }, [color]);
  React.useEffect(() => {
    if (!group.current) return;
    const focusPattern = {
      engine: /engine|motor|powertrain/i,
      chassis: /frame|chassis|swingarm/i,
      suspension: /suspension|fork|shock/i,
      wheel: /wheel|rim|brake|tire|tyre/i,
    }[focus];
    group.current.traverse((object) => {
      if (!object.isMesh) return;
      const highlighted = Boolean(focusPattern?.test(`${object.name} ${object.material?.name ?? ''}`));
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!material?.emissive) return;
        if (!originalLights.current.has(material)) originalLights.current.set(material, { color: material.emissive.getHex(), intensity: material.emissiveIntensity });
        const original = originalLights.current.get(material);
        material.emissive.set(highlighted ? '#147bd1' : original.color);
        material.emissiveIntensity = highlighted ? Math.max(original.intensity, 0.35) : original.intensity;
      });
    });
  }, [focus, gltf.scene]);
  return <group ref={motorcycleRef} position={[0, 0, 0]} rotation={[0, -0.14, 0]}><primitive ref={group} object={model} dispose={null} /></group>;
}

function CameraRig({ cameraRef, onCameraReady }) {
  const { camera, invalidate } = useThree();
  const initialZ = useRef(camera.position.z);
  const setPushIn = React.useCallback((progress) => {
    camera.position.z = initialZ.current - progress * 0.38;
    camera.lookAt(0, 1.05, 0);
    invalidate();
  }, [camera, invalidate]);
  const cameraApi = React.useMemo(() => ({ camera, invalidate, setPushIn }), [camera, invalidate, setPushIn]);
  useImperativeHandle(cameraRef, () => cameraApi, [cameraApi]);
  React.useEffect(() => {
    camera.lookAt(0, 1.05, 0);
    invalidate();
    onCameraReady?.(cameraApi);
  }, [cameraApi, onCameraReady, camera, invalidate]);
  return null;
}

const Yamaha3DScene = forwardRef(function Yamaha3DScene({ color, focus, modelState, onCapabilities, onCameraReady, className = '', motorcycleRef, rimLightRef }, ref) {
  const cameraRef = useRef(null);
  const mobile = window.matchMedia('(max-width: 700px)').matches;
  useImperativeHandle(ref, () => cameraRef.current);
  return <div className={`bike-canvas ${className}`}>
    <Canvas frameloop="demand" dpr={mobile ? [1, 1.25] : [1, 1.5]} camera={{ position: mobile ? [4.6, 3, 6.8] : [4.8, 3.2, 7.5], fov: mobile ? 37 : 34 }} gl={{ antialias: !mobile, powerPreference: 'high-performance', alpha: true }} shadows={false}>
      <CameraRig cameraRef={cameraRef} onCameraReady={onCameraReady} />
      <ambientLight intensity={0.85} />
      <spotLight position={[2, 5, 4]} intensity={34} angle={0.55} penumbra={0.8} />
      <pointLight ref={rimLightRef} position={[-3, 1.5, -2]} color="#1472d4" intensity={10} />
      <pointLight position={[0, 4, -1]} color="#b9d5ff" intensity={8} />
      <Suspense fallback={<LoadingMark />}>
        {modelState === 'available'
          ? <MotorcycleModel color={color} focus={focus} onCapabilities={onCapabilities} motorcycleRef={motorcycleRef} />
          : <Html center><span className="yamaha02-empty">YAMAHA MODEL SLOT</span></Html>}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.1} position={[0, 5, -4]} scale={[8, 5, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#328bd0" position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[5, 4, 1]} />
          <Lightformer form="rect" intensity={1.1} position={[5, 2, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 4, 1]} />
        </Environment>
      </Suspense>
      <ContactShadows position={[0, 0, 0]} opacity={0.42} scale={7} blur={2.8} far={3} frames={1} resolution={mobile ? 256 : 384} />
    </Canvas>
  </div>;
});

export { Yamaha3DScene };
