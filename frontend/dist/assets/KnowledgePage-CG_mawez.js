import{u as h,j as e}from"./query-C_dzQdD4.js";import{r as y}from"./vendor-DTKs4r77.js";import{c as p,e as w,I as v,S as b,p as C,C as N,a as j,b as k,d as T}from"./index-BGh1nbng.js";import{b as S}from"./date-DnJrSi8H.js";import{E as A}from"./EmptyState-D8tAzK_R.js";import"./charts-Bn3_F-Fe.js";const d=[{id:"kb_001",title:"Resolving Payment Gateway Connection Pool Exhaustion",summary:"Step-by-step guide to diagnosing and resolving connection pool exhaustion in the payment service.",content:`## Problem
Connection pool exhaustion occurs when all available database connections are in use and new requests cannot be served.

## Root Cause
High concurrent transaction volume during peak hours exceeds the default pool size of 10 connections.

## Resolution
1. Increase \`DB_POOL_SIZE\` to 25 in payment service config
2. Set \`DB_POOL_TIMEOUT\` to 30 seconds
3. Enable connection pool monitoring
4. Implement circuit breaker with 5-second timeout

## Prevention
Monitor pool utilization metrics and set alerts at 80% capacity.`,category:"Infrastructure",tags:["payment","database","performance","connection-pool"],authorId:"usr_001",authorName:"Sarah Chen",viewCount:847,helpfulCount:312,isPublished:!0,createdAt:"2024-05-20T10:00:00Z",updatedAt:"2024-07-10T14:30:00Z",relatedTicketIds:["TKT-0887","TKT-0923","TKT-1001"]},{id:"kb_002",title:"SAML SSO Troubleshooting Guide",summary:"Comprehensive guide for diagnosing SAML-based SSO failures in enterprise integrations.",content:`## Common SAML Issues

### Certificate Expiry
Check certificate validity: \`openssl x509 -in cert.pem -noout -dates\`

### Metadata Mismatch
Verify IdP metadata URL matches configuration in admin panel.

### Clock Skew
Ensure server time is synchronized. SAML assertions are time-sensitive (±5 minutes).

## Resolution Steps
1. Verify certificate expiry dates
2. Re-download IdP metadata
3. Check NTP synchronization
4. Review assertion consumer service URL`,category:"Authentication",tags:["sso","saml","enterprise","authentication"],authorId:"usr_002",authorName:"James Wilson",viewCount:623,helpfulCount:241,isPublished:!0,createdAt:"2024-04-15T09:00:00Z",updatedAt:"2024-06-28T11:00:00Z",relatedTicketIds:["TKT-0756","TKT-1002"]},{id:"kb_003",title:"API Rate Limiting Configuration for Enterprise Accounts",summary:"How to configure and request increased rate limits for enterprise API consumers.",content:`## Default Limits
- Standard: 100 req/min
- Professional: 500 req/min
- Enterprise: 2000 req/min

## Requesting Limit Increases
Enterprise customers can request custom limits via the admin portal.

## Best Practices
1. Implement exponential backoff
2. Use bulk endpoints where available
3. Cache responses aggressively
4. Monitor X-RateLimit headers`,category:"API",tags:["api","rate-limiting","enterprise","integration"],authorId:"usr_001",authorName:"Sarah Chen",viewCount:445,helpfulCount:189,isPublished:!0,createdAt:"2024-06-01T10:00:00Z",updatedAt:"2024-07-05T09:00:00Z",relatedTicketIds:["TKT-1005"]}];/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=p("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=p("ThumbsUp",[["path",{d:"M7 10v12",key:"1qc93n"}],["path",{d:"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z",key:"y3tblf"}]]),u=t=>new Promise(r=>setTimeout(r,t)),g={async getArticles(){return await u(350),d},async getArticleById(t){await u(250);const r=d.find(a=>a.id===t);if(!r)throw new Error(`Article ${t} not found`);return r},async search(t){await u(500);const r=t.toLowerCase();return d.filter(a=>a.title.toLowerCase().includes(r)||a.summary.toLowerCase().includes(r)||a.tags.some(o=>o.includes(r))).map(a=>({article:a,relevanceScore:Math.random()*.4+.6,matchedChunks:[a.summary]}))}},n={all:["knowledge"],articles:()=>[...n.all,"articles"],article:t=>[...n.all,"article",t],search:t=>[...n.all,"search",t]};function P(){return h({queryKey:n.articles(),queryFn:g.getArticles})}function E(t){return h({queryKey:n.search(t),queryFn:()=>g.search(t),enabled:t.length>=2})}function O(){const[t,r]=y.useState(""),a=t.length>=2,{data:o,isLoading:x}=P(),{data:c,isLoading:m}=E(t),f=a?m:x,l=a?(c==null?void 0:c.map(s=>s.article))??[]:o??[];return e.jsxs("div",{className:"p-6 space-y-6 animate-fade-in",children:[e.jsxs("div",{className:"max-w-xl",children:[e.jsxs("div",{className:"relative",children:[e.jsx(w,{className:"absolute left-3 top-2.5 h-4 w-4 text-muted-foreground","aria-hidden":"true"}),e.jsx(v,{placeholder:"Search knowledge base…",className:"pl-9",value:t,onChange:s=>r(s.target.value),"aria-label":"Search knowledge base"})]}),a&&e.jsx("p",{className:"text-xs text-muted-foreground mt-1.5",children:m?"Searching…":`${l.length} results for "${t}"`})]}),f?e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",children:Array.from({length:3}).map((s,i)=>e.jsx(b,{},i))}):l.length===0?e.jsx(A,{icon:C,title:"No articles found",description:a?`No results for "${t}". Try different keywords.`:"No knowledge articles available yet."}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",children:l.map(s=>e.jsxs(N,{className:"hover:shadow-md transition-shadow cursor-pointer group",children:[e.jsxs(j,{className:"pb-2",children:[e.jsx("div",{className:"flex items-start justify-between gap-2",children:e.jsx(k,{className:"text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2",children:s.title})}),e.jsx("p",{className:"text-xs text-muted-foreground",children:s.category})]}),e.jsxs(T,{className:"space-y-3",children:[e.jsx("p",{className:"text-xs text-muted-foreground line-clamp-3",children:s.summary}),e.jsx("div",{className:"flex flex-wrap gap-1",children:s.tags.slice(0,3).map(i=>e.jsx("span",{className:"text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground",children:i},i))}),e.jsxs("div",{className:"flex items-center justify-between text-xs text-muted-foreground pt-1 border-t",children:[e.jsx("span",{children:s.authorName}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(I,{className:"h-3 w-3"}),s.viewCount]}),e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(L,{className:"h-3 w-3"}),s.helpfulCount]})]})]}),e.jsxs("p",{className:"text-2xs text-muted-foreground",children:["Updated ",S(s.updatedAt)]})]})]},s.id))})]})}export{O as KnowledgePage};
