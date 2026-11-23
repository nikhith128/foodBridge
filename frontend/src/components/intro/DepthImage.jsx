import { useEffect, useRef, useState } from "react";

const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uMouse;
uniform vec2 uScale;
uniform float uStrength;
void main(){
  vec2 uv = (vUv - 0.5) * uScale + 0.5;
  uv = (uv - 0.5) * 0.94 + 0.5;
  float d = texture2D(uDepth, uv).r;
  vec2 shift = uMouse * (d - 0.5) * uStrength;
  gl_FragColor = texture2D(uImage, uv + shift);
}`;

const STRENGTH = 0.035;

export default function DepthImage({ src, depth, alt = "", className = "" }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const sh = (type, code) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    } catch (e) {
      console.error(e);
      return;
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const uScale = gl.getUniformLocation(prog, "uScale");
    gl.uniform1i(gl.getUniformLocation(prog, "uImage"), 0);
    gl.uniform1i(gl.getUniformLocation(prog, "uDepth"), 1);
    gl.uniform1f(gl.getUniformLocation(prog, "uStrength"), STRENGTH);

    let raf = 0, visible = true, dead = false, aspect = 1;
    const cur = { x: 0, y: 0 }, target = { x: 0, y: 0 };

    const load = (url) =>
      new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
    const tex = (unit, img) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    const draw = () => {
      gl.uniform2f(uMouse, cur.x, cur.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      const ca = w / h;
      if (ca > aspect) gl.uniform2f(uScale, 1, aspect / ca);
      else gl.uniform2f(uScale, ca / aspect, 1);
      draw();
    };
    const loop = () => {
      raf = 0;
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      draw();
      const moving = Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001;
      if (visible && moving) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(loop); };

    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = -((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    };
    const onLeave = () => { target.x = 0; target.y = 0; kick(); };

    Promise.all([load(src), load(depth)])
      .then(([img, dep]) => {
        if (dead) return;
        aspect = img.naturalWidth / img.naturalHeight;
        tex(0, img);
        tex(1, dep);
        resize();
        setReady(true);
      })
      .catch(() => {});

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) kick();
    });
    io.observe(wrap);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [src, depth]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="h-full w-full object-cover" decoding="async" />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full transition-opacity duration-300"
        style={{ opacity: ready ? 1 : 0 }}
      />
    </div>
  );
}
