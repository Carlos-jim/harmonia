import { ThemePreset } from '../types/theme';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'spicetify',
    name: 'Spicetify Engine (color.ini)',
    category: 'Reactivo',
    description: 'Motor cromático Spicetify nativo en tiempo real con aura ambiental y variables --spice-*.',
    type: 'dynamic-album',
    accentColor: '#1db954',
    previewGradient: 'from-purple-600 via-pink-700 to-indigo-950',
    defaultBlur: 0,
    defaultOpacity: 0.85
  },
  {
    id: 'reactive-album',
    name: 'Dribbblish Dynamic',
    category: 'Reactivo',
    description: 'El tema #1 de Spicetify. Muta dinámicamente con la paleta de la portada del álbum, aura ambiental fluida y vinilo giratorio.',
    type: 'dynamic-album',
    canvasEffect: 'dribbblish-vinyl',
    accentColor: '#1db954',
    previewGradient: 'from-emerald-600 via-teal-900 to-black',
    defaultBlur: 0,
    defaultOpacity: 0.85
  },
  {
    id: 'cyberpunk-rain',
    name: 'Tokyo Night Cyberpunk',
    category: 'Animado',
    description: 'Lluvia de luces y estelas neón estilo Blade Runner con reflejos cian/magenta en 60 FPS.',
    type: 'animated-canvas',
    canvasEffect: 'cyberpunk-rain',
    accentColor: '#f43f5e',
    previewGradient: 'from-fuchsia-600 via-purple-900 to-cyan-950',
    defaultBlur: 0,
    defaultOpacity: 0.8
  },
  {
    id: 'aurora-waves',
    name: 'Liquid Aurora Glass',
    category: 'Animado',
    description: 'Ondas bioluminiscentes de gradiente líquido fluido con movimiento orgánico y reflejos de cristal.',
    type: 'animated-canvas',
    canvasEffect: 'aurora-waves',
    accentColor: '#06b6d4',
    previewGradient: 'from-cyan-500 via-blue-800 to-indigo-950',
    defaultBlur: 6,
    defaultOpacity: 0.75
  },
  {
    id: 'retro-synthwave',
    name: 'Outrun Synthwave 80s',
    category: 'Animado',
    description: 'Cuadrícula retroiluminada en perspectiva 3D avanzando en tiempo real hacia un sol de neón púrpura.',
    type: 'animated-canvas',
    canvasEffect: 'retro-synthwave',
    accentColor: '#ec4899',
    previewGradient: 'from-pink-600 via-purple-950 to-indigo-950',
    defaultBlur: 0,
    defaultOpacity: 0.85
  },
  {
    id: 'bloom-mesh',
    name: 'Apple Bloom Frosted',
    category: 'Animado',
    description: 'Gradiente de malla orgánica líquida en constante órbita suave con efecto de vidrio esmerilado translúcido.',
    type: 'animated-canvas',
    canvasEffect: 'bloom-mesh',
    accentColor: '#a855f7',
    previewGradient: 'from-purple-600 via-violet-900 to-blue-950',
    defaultBlur: 8,
    defaultOpacity: 0.8
  },
  {
    id: 'starfield',
    name: 'Deep Space Warp',
    category: 'Animado',
    description: 'Salto hiperespacial a la velocidad de la luz a través de un campo de estrellas en perspectiva 3D.',
    type: 'animated-canvas',
    canvasEffect: 'starfield',
    accentColor: '#818cf8',
    previewGradient: 'from-indigo-600 via-slate-900 to-black',
    defaultBlur: 0,
    defaultOpacity: 0.85
  },
  {
    id: 'nordic-snow',
    name: 'Nordic Polar Frost',
    category: 'Animado',
    description: 'Paleta ártica oficial Spicetify Nord (#88c0d0) con suaves copos de nieve flotando sobre noche polar.',
    type: 'animated-canvas',
    canvasEffect: 'nordic-snow',
    accentColor: '#38bdf8',
    previewGradient: 'from-sky-700 via-slate-900 to-neutral-950',
    defaultBlur: 0,
    defaultOpacity: 0.75
  },
  {
    id: 'lofi-particles',
    name: 'Cozy Lo-Fi Coffee',
    category: 'Animado',
    description: 'Briznas cálidas de fogata nocturna y orbes ámbar flotantes para sesiones de estudio relajantes.',
    type: 'animated-canvas',
    canvasEffect: 'lofi-particles',
    accentColor: '#f59e0b',
    previewGradient: 'from-amber-600 via-orange-950 to-black',
    defaultBlur: 2,
    defaultOpacity: 0.7
  },
  {
    id: 'rainy-window-video',
    name: 'Lluvia en la Ventana (Video HD)',
    category: 'Animado',
    description: 'Bucle de video relajante en alta definición con gotas de lluvia deslizándose suavemente sobre el cristal.',
    type: 'video-loop',
    backgroundUrl: 'https://cdn.pixabay.com/video/2020/05/25/40149-425021287_tiny.mp4',
    accentColor: '#67e8f9',
    previewGradient: 'from-sky-700 via-slate-800 to-black',
    defaultBlur: 4,
    defaultOpacity: 0.6
  },
  {
    id: 'oled-minimal',
    name: 'OLED Stealth Dark',
    category: 'Minimalista',
    description: 'Negro absoluto (#000000) sin animaciones. Máxima eficiencia energética, cero distracciones y contraste puro.',
    type: 'oled-black',
    accentColor: '#1db954',
    previewGradient: 'from-neutral-900 via-black to-black',
    defaultBlur: 0,
    defaultOpacity: 1
  },
  {
    id: 'custom',
    name: 'Fondo Personalizado',
    category: 'Personalizado',
    description: 'Usa tu propio enlace de video (MP4/WebM) o wallpaper para una personalización total.',
    type: 'image-static',
    accentColor: '#1db954',
    previewGradient: 'from-slate-700 via-slate-800 to-slate-950',
    defaultBlur: 8,
    defaultOpacity: 0.6
  }
];
