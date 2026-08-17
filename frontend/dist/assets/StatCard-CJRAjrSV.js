import{j as e}from"./query-Dg1SIh1F.js";import{c as h,C as j,h as f,F as m}from"./index-C6XN3vEZ.js";/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=h("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=h("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=h("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);function N({data:t,isUp:d}){if(!t||t.length<2)return null;const n=t.map(o=>o.value),l=Math.min(...n),i=Math.max(...n)-l||1,c=64,a=24,r=t.map((o,u)=>{const p=u/(t.length-1)*c,v=a-(o.value-l)/i*(a-4)-2;return`${p.toFixed(1)},${v.toFixed(1)}`}).join(" "),x=d?"hsl(var(--color-success))":"hsl(var(--color-danger))";return e.jsx("svg",{width:c,height:a,className:"overflow-visible opacity-80 shrink-0","aria-hidden":"true",children:e.jsx("polyline",{fill:"none",stroke:x,strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round",points:r})})}function C({title:t,value:d,description:n,icon:l,trend:s,sparkline:i,className:c,iconClassName:a}){const r=s?s.value>=0:!0,x=(s==null?void 0:s.isPositiveGood)!==void 0?r?s.isPositiveGood:!s.isPositiveGood:r,o=s?s.value>0?k:s.value<0?y:g:null,u=s?x?"text-success":"text-danger":"text-muted-foreground";return e.jsx(j,{className:m("transition-all duration-200 hover:shadow-md hover:border-primary/30",c),children:e.jsxs(f,{className:"p-5",children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{className:"space-y-1 min-w-0 flex-1",children:[e.jsx("p",{className:"text-xs font-medium text-muted-foreground truncate",children:t}),e.jsx("p",{className:"text-2xl font-bold font-mono tracking-tight text-foreground",children:d}),n&&e.jsx("p",{className:"text-2xs text-muted-foreground truncate",children:n})]}),e.jsx("div",{className:m("rounded-xl p-2.5 bg-primary/10 shrink-0",a),children:e.jsx(l,{className:"h-5 w-5 text-primary","aria-hidden":"true"})})]}),e.jsxs("div",{className:"mt-3 flex items-center justify-between gap-2 pt-1 border-t border-border/50",children:[s&&o?e.jsxs("div",{className:m("flex items-center gap-1 text-xs font-medium",u),children:[e.jsx(o,{className:"h-3.5 w-3.5","aria-hidden":"true"}),e.jsxs("span",{children:[Math.abs(s.value),"%"]}),e.jsx("span",{className:"text-muted-foreground font-normal text-2xs truncate",children:s.label})]}):e.jsx("div",{}),i&&i.length>1&&e.jsx(N,{data:i,isUp:r})]})]})})}export{C as S,k as T,y as a};
