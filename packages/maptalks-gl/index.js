export * from 'maptalks';
export * from '@maptalks/gl';
import { transcoders } from '@maptalks/gl';
if (typeof window !== 'undefined') {
    // transcoders are registered at maptalksgl namespace
    // @ts-expect-error-error
    window.maptalksgl = window.maptalksgl || {};
    // @ts-expect-error-error
    window.maptalksgl.transcoders = window.maptalksgl.transcoders || transcoders;
}
export * from '@maptalks/vt';
export * from '@maptalks/3dtiles';
export * from '@maptalks/gltf-layer';
export * from '@maptalks/transform-control';
export * from '@maptalks/video-layer';
export * from 'maptalks.heatmap';
export * from 'maptalks.routeplayer';
export * from 'maptalks.mapboxgl';
export * from 'maptalks.three';
export {transcoders};