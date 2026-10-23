export type BackgroundType =
  | 'dynamic-album'     // Paleta reactiva extraída de la portada en reproducción
  | 'animated-canvas'   // Renderizado de shaders y partículas en canvas 60fps
  | 'video-loop'        // Video MP4/WebM en bucle continuo estilo Spotify Canvas
  | 'image-static'      // Wallpaper o imagen fija
  | 'oled-black';       // Negro absoluto #000000 para pantallas OLED

export type CanvasEffectType =
  | 'cyberpunk-rain'
  | 'aurora-waves'
  | 'starfield'
  | 'lofi-particles'
  | 'retro-synthwave'
  | 'bloom-mesh'
  | 'nordic-snow'
  | 'dribbblish-vinyl';

export interface ThemePreset {
  id: string;
  name: string;
  category: 'Animado' | 'Reactivo' | 'Estático' | 'Minimalista' | 'Personalizado';
  description: string;
  type: BackgroundType;
  accentColor: string;
  previewGradient: string;
  backgroundUrl?: string;
  canvasEffect?: CanvasEffectType;
  defaultBlur: number;    // Desenfoque en px (0 a 30)
  defaultOpacity: number; // Opacidad del fondo (0.1 a 1.0)
}

export interface UserThemeConfig {
  presetId: string;
  customType: BackgroundType;
  customUrl: string;
  blur: number;
  opacity: number;
  accentColor: string;
}
