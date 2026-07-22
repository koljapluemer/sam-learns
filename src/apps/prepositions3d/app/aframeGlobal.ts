// Importing 'aframe' registers its custom elements (<a-scene>, <a-entity>,
// ...) globally as a side effect, exactly like loading it from a <script>
// tag would. It also exposes its own bundled three.js instance on
// `AFRAME.THREE` - not the separate `three` npm package installed for
// tprboard. Neither ships installable .d.ts files in the versions used
// here, so these are typed as `any` throughout this app (see app/types.ts).
import 'aframe'

export const AFRAME: any = (globalThis as any).AFRAME
export const THREE: any = AFRAME.THREE
