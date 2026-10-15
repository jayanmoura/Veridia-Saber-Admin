import { useState, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Bounds, useBounds, useGLTF, Html, useCursor } from '@react-three/drei';
import { type ModeloOrgao, parteDoNo } from './modelosMorfologia';

export interface Visualizador3DProps {
  modelo: ModeloOrgao;
  parteSelecionada: string | null;
  onSelecionar: (id: string | null) => void;
  resetSignal?: number;
}

interface CenaModeloProps {
  modelo: ModeloOrgao;
  parteSelecionada: string | null;
  onSelecionar: (id: string | null) => void;
  hoveredParte: string | null;
  setHoveredParte: (id: string | null) => void;
  prefersReducedMotion: boolean;
  resetSignal: number;
}

function CenaModelo({
  modelo,
  parteSelecionada,
  onSelecionar,
  hoveredParte,
  setHoveredParte,
  resetSignal
}: CenaModeloProps) {
  const { scene } = useGLTF(modelo.url);
  const { invalidate } = useThree();
  const bounds = useBounds();
  const isFirstRender = useRef(true);
  const isFirstReset = useRef(true);

  // Clona a cena e os materiais, mapeia partes e desativa raycast das malhas densas
  const { clonedScene, mapPartes, hotspots, boundsMap } = useMemo(() => {
    const cloned = scene.clone(true);
    const map = new Map<string, THREE.Mesh[]>();

    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }

        const isNaoSelecionavel = modelo.naoSelecionaveis.includes(mesh.name);
        const isPelos = mesh.name.toLowerCase().includes('pelos');
        if (isNaoSelecionavel || isPelos) {
          mesh.raycast = () => {};
        }

        const parte = parteDoNo(modelo, mesh.name);
        if (parte) {
          const list = map.get(parte.id) ?? [];
          list.push(mesh);
          map.set(parte.id, list);
        }
      }
    });

    cloned.updateMatrixWorld(true);

    const boundsMapResult = new Map<string, THREE.Box3>();
    const hotspotsList: { id: string; numero: number; rotulo: string; posicao: [number, number, number] }[] = [];

    modelo.partes.forEach((parte, index) => {
      const meshes = map.get(parte.id) ?? [];
      const box = new THREE.Box3();
      for (const m of meshes) {
        box.expandByObject(m);
      }
      boundsMapResult.set(parte.id, box);

      const center = new THREE.Vector3();
      box.getCenter(center);

      if (parte.id === 'coifa') {
        // Para a coifa, usa o ponto mais baixo em Y
        center.y = box.min.y;
      } else if (parte.id === 'laterais') {
        // Para as laterais, ancora em raiz_secundaria_01
        let secundaria01: THREE.Mesh | undefined;
        cloned.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && c.name === 'raiz_secundaria_01') {
            secundaria01 = c as THREE.Mesh;
          }
        });
        if (secundaria01) {
          const secBox = new THREE.Box3().setFromObject(secundaria01);
          secBox.getCenter(center);
        }
      }

      const offset = parte.deslocamentoHotspot ?? [0, 0, 0];

      hotspotsList.push({
        id: parte.id,
        numero: index + 1,
        rotulo: parte.rotulo,
        posicao: [center.x + offset[0], center.y + offset[1], center.z + offset[2]]
      });
    });

    return {
      clonedScene: cloned,
      mapPartes: map,
      hotspots: hotspotsList,
      boundsMap: boundsMapResult
    };
  }, [scene, modelo]);

  // Atualiza materiais em hover e seleção
  useEffect(() => {
    for (const [parteId, meshes] of mapPartes.entries()) {
      const isSelected = parteId === parteSelecionada;
      const isHovered = parteId === hoveredParte && !isSelected;

      const emissiveHex = isSelected ? '#4a7c5a' : isHovered ? '#7ab08a' : '#000000';
      const emissiveIntensity = isSelected ? 0.5 : isHovered ? 0.25 : 0;

      for (const mesh of meshes) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          if (mat && 'emissive' in mat) {
            const standardMat = mat as THREE.MeshStandardMaterial;
            standardMat.emissive.set(emissiveHex);
            standardMat.emissiveIntensity = emissiveIntensity;
          }
        }
      }
    }
    invalidate();
  }, [parteSelecionada, hoveredParte, mapPartes, invalidate]);

  // Enquadra câmera na parte selecionada com useBounds
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!parteSelecionada) return;
    }

    if (parteSelecionada) {
      const box = boundsMap.get(parteSelecionada);
      if (box && !box.isEmpty()) {
        bounds.refresh(box).fit();
      }
    } else {
      bounds.refresh().fit();
    }
    invalidate();
  }, [parteSelecionada, bounds, boundsMap, invalidate]);

  // Efeito do sinal de reset: recentraliza modelo e target da câmera
  useEffect(() => {
    if (isFirstReset.current) {
      isFirstReset.current = false;
      return;
    }
    bounds.refresh().fit();
    invalidate();
  }, [resetSignal, bounds, invalidate]);

  return (
    <group>
      <primitive
        object={clonedScene}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          const parte = parteDoNo(modelo, e.object.name);
          if (parte) {
            onSelecionar(parte.id === parteSelecionada ? null : parte.id);
          }
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          const parte = parteDoNo(modelo, e.object.name);
          if (parte) {
            setHoveredParte(parte.id);
          }
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHoveredParte(null);
        }}
      />

      {/* Hotspots numerados */}
      {hotspots.map((hotspot) => {
        const isSelected = parteSelecionada === hotspot.id;
        return (
          <Html key={hotspot.id} position={hotspot.posicao} center zIndexRange={[20, 0]}>
            <button
              type="button"
              aria-label={`${hotspot.numero}. ${hotspot.rotulo}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelecionar(isSelected ? null : hotspot.id);
              }}
              onMouseEnter={() => setHoveredParte(hotspot.id)}
              onMouseLeave={() => setHoveredParte(null)}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-forest-400 transition-colors ${
                isSelected ? 'bg-earth-800' : 'bg-forest-900'
              }`}
            >
              {hotspot.numero}
            </button>
          </Html>
        );
      })}
    </group>
  );
}

export default function Visualizador3D({
  modelo,
  parteSelecionada,
  onSelecionar,
  resetSignal = 0
}: Visualizador3DProps) {
  const [hoveredParte, setHoveredParte] = useState<string | null>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useCursor(hoveredParte !== null);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 35, position: [0, 0, 5], near: 0.005, far: 100 }}
      onPointerMissed={() => onSelecionar(null)}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#ffffff', '#7a5c3a', 0.5]} />
      <directionalLight position={[2, 5, 4]} intensity={1.2} />

      <Bounds fit observe margin={1.15} maxDuration={prefersReducedMotion ? 0.001 : 1.0}>
        <CenaModelo
          modelo={modelo}
          parteSelecionada={parteSelecionada}
          onSelecionar={onSelecionar}
          hoveredParte={hoveredParte}
          setHoveredParte={setHoveredParte}
          prefersReducedMotion={prefersReducedMotion}
          resetSignal={resetSignal}
        />
      </Bounds>

      <OrbitControls
        makeDefault
        enableDamping={!prefersReducedMotion}
        enablePan={true}
        screenSpacePanning={true}
        zoomToCursor={true}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
        autoRotate={false}
        minDistance={0.12}
        maxDistance={12}
      />
    </Canvas>
  );
}

useGLTF.preload('/modelos3d/raiz.glb');
