// Original vector illustrations. No remote images or character assets.
export function svgNode(tag, attributes = {}, parent) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (parent) parent.append(node);
  return node;
}
export const SEARCH_ITEMS = {
  santa: ['Santa with a star on his hat', 'Santa with a striped hat', 'Santa holding a candy cane', 'Santa with a green hat', 'Santa wearing earmuffs', 'Santa with a pom-pom hat'],
  present: ['The star-covered present', 'The striped present', 'The spotted present', 'The heart-covered present', 'The present with a big bow', 'The zigzag present'],
  bell: ['The bell with a bow', 'The bell with a star', 'The striped bell', 'The bell with a heart', 'The bell with holly', 'The plain bell'],
  snowman: ['The snowman with a striped scarf', 'The snowman wearing earmuffs', 'The snowman with a star hat', 'The snowman holding a broom', 'The snowman with a blue hat', 'The snowman with a red hat']
};
export function searchArt(kind, variant) {
  const svg = svgNode('svg', { viewBox: '0 0 64 74', 'aria-hidden': 'true', focusable: 'false' });
  const shape = (tag, attrs) => svgNode(tag, attrs, svg);
  const star = (x, y, size = 6) => shape('path', { d: `M${x} ${y-size}l${size*.3} ${size*.65} ${size*.7} ${size*.05}-${size*.5} ${size*.5} ${size*.15} ${size*.75}-${size*.65}-${size*.35}-${size*.65} ${size*.35} ${size*.15}-${size*.75}-${size*.5}-${size*.5} ${size*.7}-${size*.05}Z`, fill: '#ffe28b' });
  if (kind === 'santa') {
    shape('path', { d: 'M14 65Q9 35 30 36Q54 35 52 65Z', fill: '#ae3746', stroke: '#542b38', 'stroke-width': 2 });
    shape('rect', { x: 13, y: 56, width: 39, height: 5, fill: '#26313b' });
    shape('rect', { x: 29, y: 55, width: 9, height: 7, rx: 1, fill: '#e0bb68' });
    shape('circle', { cx: 32, cy: 30, r: 16, fill: '#eec19e' });
    shape('path', { d: 'M16 31Q17 56 32 53Q48 52 48 31L38 37H26Z', fill: '#f0eee1' });
    shape('path', { d: 'M15 23 35 2 48 23Z', fill: variant === 3 ? '#327561' : '#b23647', stroke: '#f2eadb', 'stroke-width': 3 });
    for (const x of [26, 38]) shape('circle', { cx: x, cy: 29, r: 1.6, fill: '#262b35' });
    shape('circle', { cx: 32, cy: 34, r: 3, fill: '#df9b86' });
    if (variant === 0) star(33, 15, 6);
    if (variant === 1) { shape('path', { d: 'M26 12h13M21 18h23', stroke: '#f5ead0', 'stroke-width': 3 }); }
    if (variant === 2) shape('path', { d: 'M53 64V35q0-12 8-8', fill: 'none', stroke: '#fff1dc', 'stroke-width': 5 });
    if (variant === 4) for (const x of [15, 49]) shape('circle', { cx: x, cy: 29, r: 5, fill: '#d8ae59' });
    if (variant === 5) shape('circle', { cx: 35, cy: 4, r: 5, fill: '#fff1df' });
  } else if (kind === 'present') {
    shape('rect', { x: 9, y: 24, width: 46, height: 42, rx: 3, fill: '#b24653', stroke: '#653541', 'stroke-width': 2 });
    if (variant === 0) { star(21, 39); star(43, 54); }
    if (variant === 1) for (const y of [31, 42, 53]) shape('path', { d: `M10 ${y}h44`, stroke: '#f0d99a', 'stroke-width': 4 });
    if (variant === 2) for (const [x,y] of [[20,35],[42,35],[31,47],[20,58],[43,58]]) shape('circle', { cx:x, cy:y, r:3, fill:'#efd69a' });
    if (variant === 3) shape('path', { d:'M32 56 18 42Q11 29 24 31L32 37 40 31Q55 29 46 43Z', fill:'#f2d09a' });
    if (variant === 4) { shape('path', { d:'M32 26Q7 3 14 24Q17 32 32 26Q58 2 50 23Q47 31 32 26', fill:'#f0d590' }); shape('path',{d:'M32 26v39',stroke:'#f0d590','stroke-width':6}); }
    if (variant === 5) shape('path', { d:'m12 39 8 8 8-8 8 8 8-8 8 8', fill:'none',stroke:'#f4d69b','stroke-width':4 });
    shape('rect', { x:7,y:21,width:50,height:8,rx:2,fill:'#dba966' });
  } else if (kind === 'bell') {
    shape('path',{d:'M13 57Q21 47 20 34Q20 17 32 17Q46 17 45 34Q44 48 53 57Z',fill:'#d8ad54',stroke:'#86632f','stroke-width':2});
    shape('circle',{cx:32,cy:60,r:6,fill:'#99703c'});
    shape('rect',{x:10,y:54,width:46,height:6,rx:3,fill:'#f1d589'});
    if (variant === 0) shape('path',{d:'M32 23Q10 6 18 25L32 20Q54 5 46 25Z',fill:'#a63649'});
    if (variant === 1) star(32,38,9);
    if (variant === 2) shape('path',{d:'M20 34h24M18 44h28',stroke:'#a23e48','stroke-width':5});
    if (variant === 3) shape('path',{d:'M32 48 23 39Q19 31 27 33L32 37 37 33Q46 31 41 39Z',fill:'#aa3b49'});
    if (variant === 4) { shape('path',{d:'M32 28Q9 20 22 11Q32 10 32 28Q52 6 55 20Q48 30 32 28',fill:'#2f7658'});shape('circle',{cx:32,cy:24,r:4,fill:'#a33747'}); }
  } else {
    shape('circle',{cx:32,cy:53,r:19,fill:'#e9eeeb',stroke:'#a4b8bd','stroke-width':2});
    shape('circle',{cx:32,cy:28,r:14,fill:'#f2f1e8',stroke:'#a4b8bd','stroke-width':2});
    shape('path',{d:'M18 15h28v6H18Z',fill:'#283e54'});
    shape('rect',{x:23,y:3,width:18,height:14,fill:variant===4?'#39619d':variant===5?'#ab3d4b':'#31534c'});
    shape('path',{d:'m32 29 13 4-13 2Z',fill:'#dd9345'});
    for (const x of [27,36]) shape('circle',{cx:x,cy:26,r:1.7,fill:'#283c42'});
    shape('path',{d:'M18 38h28v6H18Z M38 39v17h6V39',fill:'#b14850'});
    if (variant===0) shape('path',{d:'M21 38v6m7-6v6m7-6v6m7-6v6',stroke:'#f4deb1','stroke-width':3});
    if (variant===1) for (const x of [17,47]) shape('circle',{cx:x,cy:27,r:5,fill:'#cb9759'});
    if (variant===2) star(32,10,5);
    if (variant===3) { shape('path',{d:'m53 67-3-44',stroke:'#ae8050','stroke-width':3});shape('path',{d:'m44 26 5-14 7 13Z',fill:'#d6ae60'}); }
    shape('circle',{cx:30,cy:52,r:2,fill:'#29404b'});shape('circle',{cx:30,cy:62,r:2,fill:'#29404b'});
  }
  return svg;
}
export function plainTree() {
  const svg=svgNode('svg',{viewBox:'0 0 300 400',role:'img','aria-label':'Plain evergreen tree, ready for your decorations',class:'plain-tree'});
  const defs=svgNode('defs',{},svg);const gradient=svgNode('linearGradient',{id:'plain-evergreen-shading',x1:'0',y1:'0',x2:'1',y2:'1'},defs);for(const [offset,color]of[['0%','#63a778'],['45%','#367d57'],['100%','#154f40']])svgNode('stop',{offset,'stop-color':color},gradient);
  svgNode('ellipse',{cx:150,cy:385,rx:77,ry:10,fill:'#bdd6cd',opacity:'.28'},svg);
  svgNode('rect',{x:135,y:325,width:30,height:64,rx:5,fill:'#825d42'},svg);
  svgNode('path',{d:'M150 180 20 348H280Z',fill:'url(#plain-evergreen-shading)',stroke:'#7fa88a','stroke-width':2},svg);
  svgNode('path',{d:'M150 100 49 256H251Z',fill:'url(#plain-evergreen-shading)',stroke:'#8ab593','stroke-width':2},svg);
  svgNode('path',{d:'M150 22 79 154H221Z',fill:'url(#plain-evergreen-shading)',stroke:'#9cc8a4','stroke-width':2},svg);
  return svg;
}
export function treeWidth(y) {
  const triangles=[[5.5,38.5,23.7],[25,64,33.7],[45,87,43.3]];
  return Math.max(0,...triangles.map(([top,bottom,width])=>y>=top&&y<=bottom?width*(y-top)/(bottom-top):0));
}
