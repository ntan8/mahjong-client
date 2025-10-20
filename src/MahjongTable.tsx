import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import CHARS_1 from './assets/tiles/1_CHARS.jpg';
import CHARS_2 from './assets/tiles/2_CHARS.jpg';
import CHARS_3 from './assets/tiles/3_CHARS.jpg';
import CHARS_4 from './assets/tiles/4_CHARS.jpg';
import CHARS_5 from './assets/tiles/5_CHARS.jpg';
import CHARS_6 from './assets/tiles/6_CHARS.jpg';
import CHARS_7 from './assets/tiles/7_CHARS.jpg';
import CHARS_8 from './assets/tiles/8_CHARS.jpg';
import CHARS_9 from './assets/tiles/9_CHARS.jpg';
import BALLS_1 from './assets/tiles/1_BALLS.jpg';
import BALLS_2 from './assets/tiles/2_BALLS.jpg';
import BALLS_3 from './assets/tiles/3_BALLS.jpg';
import BALLS_4 from './assets/tiles/4_BALLS.jpg';
import BALLS_5 from './assets/tiles/5_BALLS.jpg';
import BALLS_6 from './assets/tiles/6_BALLS.jpg';
import BALLS_7 from './assets/tiles/7_BALLS.jpg';
import BALLS_8 from './assets/tiles/8_BALLS.jpg';
import BALLS_9 from './assets/tiles/9_BALLS.jpg';


interface Tile {
    number: number;
    type: string;
    isFlower: boolean;
}

const TILE_IMAGES: Record<string, string> = {
    'CHARS_1': CHARS_1,
    'CHARS_2': CHARS_2,
    'CHARS_3': CHARS_3,
    'CHARS_4': CHARS_4,
    'CHARS_5': CHARS_5,
    'CHARS_6': CHARS_6,
    'CHARS_7': CHARS_7,
    'CHARS_8': CHARS_8,
    'CHARS_9': CHARS_9,
    'BALLS_1': BALLS_1,
    'BALLS_2': BALLS_2,
    'BALLS_3': BALLS_3,
    'BALLS_4': BALLS_4,
    'BALLS_5': BALLS_5,
    'BALLS_6': BALLS_6,
    'BALLS_7': BALLS_7,
    'BALLS_8': BALLS_8,
    'BALLS_9': BALLS_9,
};

const MahjongTable = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [currentHand, setCurrentHand] = useState<Tile[]>([]);
        const [selectedTile, setSelectedTile] = useState<number | null>(null);

    const [gameId, setGameId] = useState<number>(0);
    
    // Refs for Three.js objects that persist across renders
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const playerTilesRef = useRef<THREE.Group[]>([]);
    const animationIdRef = useRef<number | null>(null);
    const discardedTilesRef = useRef<THREE.Group[]>([]);

    // Get the hand from the API
    useEffect(() => {
        const fetchHand = async () => {
            try {
                const response = await fetch('/api/game/new');
                const result = await response.json();
                console.log('Fetched hand:', result.data.currentPlayerHand);
                setCurrentHand(result.data.currentPlayerHand);
                setGameId(result.data.gameId);
            } catch (error) {
                console.error('Error fetching hand:', error);
                // Set mock data for testing if API fails
                setCurrentHand([
                    { number: 1, type: 'CHARS', isFlower: false },
                    { number: 2, type: 'CHARS', isFlower: false },
                    { number: 3, type: 'CHARS', isFlower: false },
                    { number: 4, type: 'CHARS', isFlower: false },
                    { number: 5, type: 'CHARS', isFlower: false },
                    { number: 6, type: 'CHARS', isFlower: false },
                    { number: 7, type: 'CHARS', isFlower: false },
                    { number: 8, type: 'CHARS', isFlower: false },
                    { number: 9, type: 'CHARS', isFlower: false },
                    { number: 1, type: 'BALLS', isFlower: false },
                    { number: 2, type: 'BALLS', isFlower: false },
                    { number: 3, type: 'BALLS', isFlower: false },
                    { number: 4, type: 'BALLS', isFlower: false },
                ]);
            }
        }
        fetchHand();
    }, []);

    // Initialize Three.js scene once
    useEffect(() => {
        if (!mountRef.current) return;

        console.log('Initializing Three.js scene...');

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a4d2e);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 6, 18);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 15, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        scene.add(directionalLight);

        // Circular table with center play area
        const outerRadius = 15;
        const innerRadius = 4;

        const tableShape = new THREE.Shape();
        tableShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
        const holePath = new THREE.Path();
        holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
        tableShape.holes.push(holePath);

        const tableGeometry = new THREE.ExtrudeGeometry(tableShape, {
            depth: 0.3,
            bevelEnabled: false
        });
        tableGeometry.rotateX(-Math.PI / 2);

        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5a3d,
            roughness: 0.7,
            metalness: 0.1
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.y = -0.15;
        table.receiveShadow = true;
        scene.add(table);

        // Center play area
        const centerGeometry = new THREE.CircleGeometry(innerRadius, 32);
        centerGeometry.rotateX(-Math.PI / 2);
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d6d4d,
            roughness: 0.6,
            metalness: 0.1
        });
        const centerArea = new THREE.Mesh(centerGeometry, centerMaterial);
        centerArea.position.y = -0.14;
        centerArea.receiveShadow = true;
        scene.add(centerArea);

        // Wall tiles in center
        const wallGeometry = new THREE.BoxGeometry(3, 0.4, 3);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4c4b0,
            roughness: 0.4,
            metalness: 0.1
        });
        const wallPile = new THREE.Mesh(wallGeometry, wallMaterial);
        wallPile.position.set(0, 0.2, 0);
        wallPile.castShadow = true;
        wallPile.receiveShadow = true;
        scene.add(wallPile);

        // Create opponent hands (these don't change)
        createOpponentHand(Math.PI / 2, 8, scene);
        createOpponentHand(Math.PI, 8, scene);
        createOpponentHand(-Math.PI / 2, 8, scene);

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            // Animate player tiles
            playerTilesRef.current.forEach((tile, index) => {
                tile.position.y = 0.6 + Math.sin(Date.now() * 0.003 + index) * 0.05;
            });

            renderer.render(scene, camera);
        };
        animate();

        // Mouse interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoverIndex = -1;

        const onMouseMove = (event: MouseEvent) => {
            if (!mountRef.current) return;
            const rect = mountRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(playerTilesRef.current, true);

            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                let tile = intersectedObject.parent;
                if (tile && playerTilesRef.current.includes(tile as THREE.Group)) {
                    hoverIndex = playerTilesRef.current.indexOf(tile as THREE.Group);
                    document.body.style.cursor = 'pointer';
                    
                    // Highlight hovered tile
                    playerTilesRef.current.forEach((t, i) => {
                        if (i === hoverIndex) {
                            t.position.y = 0.9;
                        }
                    });
                } else {
                    hoverIndex = -1;
                    document.body.style.cursor = 'default';
                }
            } else {
                hoverIndex = -1;
                document.body.style.cursor = 'default';
            }
        };

        const onClick = (event: MouseEvent) => {
            if (!mountRef.current) return;
            const rect = mountRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(playerTilesRef.current, true);

            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                let tile = intersectedObject.parent;

                if (tile && playerTilesRef.current.includes(tile as THREE.Group)) {
                    const tileIndex = playerTilesRef.current.indexOf(tile as THREE.Group);
                    
                    // Discard the tile
                    discardTile(tile as THREE.Group);

                    // Remove from hand
                    playerTilesRef.current.splice(tileIndex, 1);
                    setCurrentHand(prev => prev.filter((_, i) => i !== tileIndex));

                    // Reorganize remaining tiles
                    reorganizePlayerHand();
                }
            }
        };

        const currentMount = mountRef.current;
        currentMount.addEventListener('mousemove', onMouseMove);
        currentMount.addEventListener('click', onClick);

        // Handle resize
        const handleResize = () => {
            console.log('Resizing renderer...');
            if (!mountRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            console.log('Cleaning up scene...');
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            window.removeEventListener('resize', handleResize);
            currentMount.removeEventListener('mousemove', onMouseMove);
            currentMount.removeEventListener('click', onClick);
            document.body.style.cursor = 'default';
            
            if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();

            scene.traverse((object) => {
                if ((object as THREE.Mesh).isMesh) {
                    const mesh = object as THREE.Mesh;
                    mesh.geometry?.dispose();
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(material => material.dispose());
                    } else if (mesh.material) {
                        mesh.material.dispose();
                    }
                }
            });
        };
    }, []);

           
const getTileImage = (number: number, type: string) => {
    const key = `${type}_${number}`;
    return TILE_IMAGES[key] || CHARS_1; // fallback to CHARS_1 if not found
};
    // Update player hand when currentHand changes
    useEffect(() => {
        if (!sceneRef.current || currentHand.length === 0) return;

        console.log('Updating player hand with:', currentHand);

        // Remove old player tiles from scene
        playerTilesRef.current.forEach(tile => {
            sceneRef.current?.remove(tile);
            tile.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    mesh.geometry?.dispose();
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(material => material.dispose());
                    } else if (mesh.material) {
                        mesh.material.dispose();
                    }
                }
            });
        });

        // Create new player hand
        const tiles: THREE.Group[] = [];
        const angle = 0;
        const distance = 8;
        const tileSpacing = 0.9;

        currentHand.forEach((handTile, i) => {
            const tile = createMahjongTile(false, handTile.number, handTile.type);
            
            const offsetX = (i - currentHand.length / 2) * tileSpacing + 0.45;
            const x = Math.sin(angle) * distance + Math.cos(angle) * offsetX;
            const z = Math.cos(angle) * distance - Math.sin(angle) * offsetX;

            tile.position.set(x, 0.6, z);
            tile.rotation.y = -angle;
            tile.rotation.x = -0.2;

            sceneRef.current?.add(tile);
            tiles.push(tile);
        });

        playerTilesRef.current = tiles;
        console.log(`Created ${tiles.length} player tiles`);

    }, [currentHand]);

    // Helper: Create opponent hand
    const createOpponentHand = (angle: number, distance: number, scene: THREE.Scene) => {
        const handSize = 13;
        const tileSpacing = 0.9;

        for (let i = 0; i < handSize; i++) {
            const tile = createMahjongTile(false);
            
            const offsetX = (i - handSize / 2) * tileSpacing + 0.45;
            const x = Math.sin(angle) * distance + Math.cos(angle) * offsetX;
            const z = Math.cos(angle) * distance - Math.sin(angle) * offsetX;

            tile.position.set(x, 0.6, z);
            tile.rotation.y = -angle;
            tile.rotation.x = -0.2;
            tile.scale.set(0.7, 0.7, 0.7);

            tile.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    if (mesh.material) {
                        const material = (mesh.material as THREE.Material).clone();
                        material.transparent = true;
                        material.opacity = 0.4;
                        mesh.material = material;
                    }
                }
            });

            scene.add(tile);
        }
    };

    // Helper: Create mahjong tile
    const createMahjongTile = (showFace: boolean, number?:number, type?:string, color: number = 0xf5e6d3) => {
              const group = new THREE.Group();

        // Tile body
        const tileGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.5);
        const tileMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.1
        });
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.castShadow = true;
        tile.receiveShadow = true;
        group.add(tile);

        const imageUrl = number && type ? getTileImage(number, type) : '';
        console.log('Creating tile with image:', imageUrl);
        // Front face (image)
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            imageUrl,
            (texture) => {
                // Texture loaded successfully
                const faceMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: 0.3,
                    metalness: 0.1
                });
                const faceGeometry = new THREE.PlaneGeometry(0.78, 1.18);
                const face = new THREE.Mesh(faceGeometry, faceMaterial);
                face.position.z = 0.251;
                group.add(face);
            },
            
            undefined,
            (error) => {
                console.error('Error loading texture:', error);
                // Fallback: create a solid color face if image fails to load
                const fallbackMaterial = new THREE.MeshStandardMaterial({
                    color: 0xcccccc,
                    roughness: 0.3,
                    metalness: 0.1
                });
                const faceGeometry = new THREE.PlaneGeometry(0.78, 1.18);
                const face = new THREE.Mesh(faceGeometry, fallbackMaterial);
                face.position.z = 0.251;
                group.add(face);
            }
        );
        return group;
    };

    // Helper: Discard tile to center
    const discardTile = (tile: THREE.Group) => {
        const discardIndex = discardedTilesRef.current.length;
        const discardGridSize = 6;
        const discardSpacing = 0.9;
        
        const row = Math.floor(discardIndex / discardGridSize);
        const col = discardIndex % discardGridSize;

        const gridWidth = (discardGridSize - 1) * discardSpacing;
        const x = col * discardSpacing - gridWidth / 2;
        const z = row * discardSpacing - gridWidth / 2;

        tile.position.set(x, 0.05, z);
        tile.rotation.set(0, 0, 0);
        tile.scale.set(0.9, 0.9, 0.9);

        discardedTilesRef.current.push(tile);
    };

    // Helper: Reorganize player hand after discard
    const reorganizePlayerHand = () => {
        const angle = 0;
        const distance = 8;
        const tileSpacing = 0.9;

        playerTilesRef.current.forEach((tile, i) => {
            const offsetX = (i - playerTilesRef.current.length / 2) * tileSpacing + 0.45;
            const x = Math.sin(angle) * distance + Math.cos(angle) * offsetX;
            const z = Math.cos(angle) * distance - Math.sin(angle) * offsetX;

            tile.position.x = x;
            tile.position.z = z;
        });
    };
  const handleDrawTile = async () => {
        try {
            const response = await fetch(`/api/game/drawTile?gameId=${gameId}&playerId=1`);
            const result = await response.json();
            setCurrentHand(result.data.currentPlayerHand);
        } catch (error) {
            console.error('Error drawing tile:', error);
        }
    };

    const handleDiscard = async () => {
        if (selectedTile === null) {
            alert('Please select a tile first');
            return;
        }
        
        const tile = currentHand[selectedTile];
        try {
            const response = await fetch('/api/game/discardTile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: tile.type, number: tile.number })
            });
            const result = await response.json();
            setCurrentHand(result.data.currentPlayerHand);
            setSelectedTile(null);
        } catch (error) {
            console.error('Error discarding tile:', error);
        }
    };

    const handleChow = async () => {
        // Implement chow logic
        console.log('Chow clicked');
    };

    const handlePong = async () => {
        // Implement pong logic
        console.log('Pong clicked');
    };
    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#111827' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Mahjong Table</h2>
                <p style={{ fontSize: '0.875rem' }}>Tiles in hand: {currentHand.length}</p>
                <p style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.5rem' }}>Click tiles to discard</p>
                <p style={{ fontSize: '0.75rem', color: '#d1d5db' }}>Discarded: {discardedTilesRef.current.length}</p>
            </div>

            {/* Action buttons */}
            <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '1rem',
                zIndex: 1000
            }}>
                <button
                    onClick={handleDrawTile}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                    Draw Tile
                </button>

                <button
                    onClick={handleDiscard}
                    disabled={selectedTile === null}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: selectedTile === null ? '#6b7280' : '#ef4444',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: selectedTile === null ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s',
                        opacity: selectedTile === null ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (selectedTile !== null) e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                        if (selectedTile !== null) e.currentTarget.style.backgroundColor = '#ef4444';
                    }}
                >
                    Discard
                </button>

                <button
                    onClick={handleChow}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: '#10b981',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                    Chow
                </button>

                <button
                    onClick={handlePong}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: '#f59e0b',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                >
                    Pong
                </button>
            </div>
        </div>
    );
};


export default MahjongTable;