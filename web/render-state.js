// Frame decisions separate visual invalidation from hover-readback invalidation.
export class FrameState {
  update({camera,visual,pick,pointer,animated}) {
    const changed = camera !== this.camera;
    const result = {render: animated || (this.animated && !animated) || changed || visual !== this.visual,
      labels: changed, pick: pointer !== null && (animated || changed || pick !== this.pick || pointer !== this.pointer)};
    Object.assign(this, {camera,visual,pick,pointer,animated});return result;
  }
}
// External reveal/controllers mutate scene/uniforms directly. Observe state on
// RAF, but submit GPU frames only when it changes; no hidden idle draw loop.
export function uniformSignature(uniforms, omitted = ['uNow','uHover']) {
  return Object.entries(uniforms).filter(([key]) => !omitted.includes(key)).map(([key,{value}]) => {
    if(value?.isTexture) return key + ':' + value.uuid + ':' + value.version;
    if(value?.toArray) return key + ':' + value.toArray();
    return key + ':' + value;
  }).join('|');
}
export function sceneSignature(scene) {
  const parts=[];scene.traverse(o => {
    parts.push(o.id,o.visible,...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray());
    if(o.material) for(const m of Array.isArray(o.material)?o.material:[o.material]) parts.push(m.uuid,m.version,m.opacity,m.visible,m.map?.version||0);
  });return parts.join(',');
}
