import{j as s}from"./query-Dg1SIh1F.js";import{c as m,F as l}from"./index-C6XN3vEZ.js";import{B as d}from"./Badge-CKBG--_z.js";import{C as p}from"./check-circle-2-C852dA79.js";import{A as x}from"./alert-circle-CoaE7PK9.js";/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=m("HelpCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);function y({score:c,showIcon:r=!0,className:t}){const e=c>1?c:c*100,i=e>=85,n=e>=60&&e<85,a=i?"success":n?"warning":"critical",o=i?p:n?f:x;return s.jsxs(d,{variant:a,className:l("inline-flex items-center gap-1 font-mono text-2xs font-medium",t),children:[r&&s.jsx(o,{className:"h-3 w-3","aria-hidden":"true"}),s.jsxs("span",{children:[e.toFixed(0),"%"]}),s.jsx("span",{className:"sr-only",children:"confidence"})]})}export{y as C};
