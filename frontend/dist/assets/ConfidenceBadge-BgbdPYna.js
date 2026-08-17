import{j as s}from"./query-Dg1SIh1F.js";import{c as l,k as m,V as d}from"./index-BRZDBAbL.js";import{C as p}from"./check-circle-2-BfZg_CWw.js";import{A as x}from"./alert-circle-DJSjsznB.js";/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=l("HelpCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);function j({score:c,showIcon:a=!0,className:r}){const e=c>1?c:c*100,n=e>=85,i=e>=60&&e<85,t=n?"success":i?"warning":"critical",o=n?p:i?f:x;return s.jsxs(m,{variant:t,className:d("inline-flex items-center gap-1 font-mono text-2xs font-medium",r),children:[a&&s.jsx(o,{className:"h-3 w-3","aria-hidden":"true"}),s.jsxs("span",{children:[e.toFixed(0),"%"]}),s.jsx("span",{className:"sr-only",children:"confidence"})]})}export{j as C};
