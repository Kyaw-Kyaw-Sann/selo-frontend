# Selo Frontend

Selo သည် ဆိုင်တစ်ဆိုင်အတွက် ရည်ရွယ်ထားသော retail Point of Sale (POS) learning project ဖြစ်သည်။ MMK ငွေကြေးနှင့် `OWNER` / `CASHIER` roles ကို အသုံးပြုပြီး catalog၊ inventory၊ purchasing နှင့် sales workflow များကို လက်တွေ့လေ့လာတည်ဆောက်ရန် ရည်ရွယ်သည်။

ဤ repository သည် Selo ၏ React frontend ဖြစ်သည်။ Backend API မှတစ်ဆင့်သာ data ကို အသုံးပြုပြီး MySQL သို့ တိုက်ရိုက်ချိတ်ဆက်ခြင်း မပြုပါ။

## လက်ရှိအခြေအနေ

Frontend သည် Product Catalog အဆင့်တွင် ရှိသည်။ Units၊ Categories နှင့် Products list၊ create/edit နှင့် activate/deactivate workflows ကို ချိတ်ထားပြီး real backend/browser verification ကျန်နေသည်။

- React + TypeScript + Vite scaffold ရှိသည်။
- Tailwind CSS ကို `src/index.css` မှတစ်ဆင့် ချိတ်ထားပြီး light theme tokens သတ်မှတ်ထားသည်။ သီးခြား `styles/globals.css` မသုံးပါ။
- React Router၊ Lucide React နှင့် Sonner ကို install လုပ်ထားသည်။
- Axios၊ TanStack Query၊ React Hook Form၊ Zod နှင့် resolver ကို install လုပ်ထားသည်။
- Login form၊ session recovery၊ Auth guard နှင့် logout ကို ချိတ်ထားသည်။ Product create/edit routes တွင် Owner guard သုံးထားသည်။
- Management shell၊ Products/Units/Categories navigation၊ shared page states နှင့် catalog API integrations ရှိသည်။ Products တွင် live search၊ exact category/status filters၊ pagination နှင့် product-specific unit fields ပါသည်။
- Build/lint နှင့် mocked auth checks အောင်မြင်ထားသော်လည်း real browser cookie/CORS၊ keyboard နှင့် responsive behavior ကို အတည်မပြုရသေးပါ။

Backend နှင့်ပတ်သက်၍ project context အရ catalog၊ inventory နှင့် purchasing endpoints ရှိပြီး sales list/detail ကို ဖတ်နိုင်သည်။ Checkout၊ customers/loyalty၊ returns နှင့် reports/dashboard သည် နောက်ပိုင်းလုပ်ငန်းများဖြစ်သည်။ Integration တစ်ခုချင်းစီတွင် လက်ရှိ backend code နှင့် API contract ကို ပြန်စစ်ရမည်။

## နည်းပညာရွေးချယ်မှု

| အပိုင်း | နည်းပညာ |
| --- | --- |
| UI | React + TypeScript |
| Development / build | Vite |
| Styling | Tailwind CSS နှင့် ကိုယ်ပိုင် reusable components |
| Routing | React Router |
| HTTP | Axios |
| Server data / cache | TanStack Query |
| Forms / validation | React Hook Form + Zod + resolver |
| Icons | Lucide React |
| Notifications | Sonner |

TanStack Query က backend data ကို စီမံမည်။ React Hook Form က form fields ကို စီမံပြီး local interactions အတွက် React state ကို အသုံးပြုမည်။ အနာဂတ် POS cart အတွက် လိုအပ်မှသာ Zustand ကို စဉ်းစားမည်။

## Local development

Node.js နှင့် npm လိုအပ်သည်။ ထည့်သွင်းထားသော Vite version နှင့် ကိုက်ညီသော Node.js version ကို အသုံးပြုပါ။

```bash
npm install
npm run dev -- --host localhost --port 5173 --strictPort
```

အထက်ပါ commands သည် dependencies ထည့်သွင်းရန်နှင့် development server ဖွင့်ရန် ဖြစ်သည်။ `.env.example` ကို `.env` အဖြစ် ကူးပြီး `VITE_API_URL` သတ်မှတ်ပါ။ Backend ကို သီးခြား run ထားရန် လိုအပ်သည်။ Vite သည် port `5173` အသုံးပြုနေပြီးသားဖြစ်ပါက အခြား port သို့ မပြောင်းဘဲ ရပ်မည်။

| Command | အသုံးပြုပုံ |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | TypeScript project check နှင့် production build |
| `npm run lint` | ESLint စစ်ဆေးခြင်း |
| `npm run preview` | Build ထုတ်ထားသော app ကို local preview ကြည့်ခြင်း |

## Backend ချိတ်ဆက်မှု

| အကြောင်းအရာ | သတ်မှတ်ချက် |
| --- | --- |
| Frontend origin | `http://localhost:5173` |
| Backend origin | `http://localhost:3000` |
| API base | `http://localhost:3000/api` |

API client တည်ဆောက်သည့်အခါ အောက်ပါ contract ကို လိုက်နာမည်။

- Axios တွင် `withCredentials: true` သတ်မှတ်ပြီး HttpOnly cookie authentication ကို အသုံးပြုမည်။ JWT ကို browser storage ထဲ မသိမ်းပါ။
- Login/logout အပါအဝင် `POST` / `PATCH` requests တွင် `X-Selo-Request: 1` header ပို့မည်။
- Session recovery အတွက် `GET /auth/me` ကို အသုံးပြုမည်။ `401` နှင့် `403` ကို သီးခြားကိုင်တွယ်မည်။
- API IDs နှင့် decimal money values ကို strings အဖြစ် ထိန်းသိမ်းမည်။ Stock ကို base units ဖြင့် ကိုင်တွယ်မည်။
- Frontend environment ထဲတွင် public configuration သာထားမည်။ Backend DB/JWT secrets မထည့်ပါ။

Shared Axios client နှင့် environment configuration ကို ချိတ်ထားပြီးဖြစ်သည်။ Browser မှာ backend cookie/CORS flow ကို ဆက်လက်စစ်ဆေးရန် လိုအပ်သည်။

### Browser verification — စစ်ဆေးရန်ကျန်

- Login မရှိဘဲ `/products` ဝင်လျှင် `/login` သို့ ပြောင်းပြီး protected content မပေါ်ခြင်း
- Blank inputs နှင့် invalid credentials တွင် သင့်လျော်သော errors ပြခြင်း၊ request failure နောက် input values မပျောက်ခြင်း
- မှန်ကန်သော account ဖြင့် login ပြီး `/products` ရောက်ခြင်း၊ refresh နောက် session ဆက်ရှိခြင်း
- Header တွင် တကယ့် user name/role ပြခြင်း၊ sign out ပြီး Back/refresh ဖြင့် protected content မရခြင်း
- Backend မရနိုင်ချိန် retry UI ပြခြင်း၊ permission errors ကို logged-out အဖြစ် မယူဆခြင်း
- Owner/Cashier နှစ်မျိုးဖြင့် စစ်ခြင်း၊ narrow viewport နှင့် keyboard focus/skip link စစ်ခြင်း

## Development အစီအစဉ်

Units အတွက် browser မှာ ဆက်စစ်ရန်—

- Name/code live search ကို 300ms debounce ဖြင့် စစ်ခြင်း၊ search အသစ်တွင် page 1 ပြန်စခြင်း၊ no-results နှင့် pagination စစ်ခြင်း
- Owner ဖြင့် create/edit၊ duplicate code error၊ active/inactive ပြောင်းခြင်းနှင့် list refresh စစ်ခြင်း
- Cashier ဖြင့် list ဖတ်နိုင်ပြီး management actions မပေါ်ခြင်း
- Dialog initial focus၊ Tab၊ Escape/Cancel၊ save pending နှင့် close နောက် focus ပြန်ရောက်မှု စစ်ခြင်း
- Session expired၊ permission denied၊ network failure နှင့် retry behavior စစ်ခြင်း

Implementation review နှင့် mocked checks သည် real backend/browser workflow အောင်မြင်ကြောင်း အတည်ပြုချက် မဟုတ်ပါ။

Categories အတွက် browser မှာ ဆက်စစ်ရန်—

- Root/child list နှင့် root-only pagination counts မှန်ခြင်း
- Parent options ကို root pages အားလုံးက ရရှိခြင်း၊ child ကို parent အဖြစ် မရွေးနိုင်ခြင်း
- Create root/child၊ name-only edit၊ child ကို root ပြောင်းခြင်းနှင့် parent reassignment စစ်ခြင်း
- Self-parent နှင့် children ရှိတဲ့ root ကို အခြား parent အောက်ရွှေ့ခြင်းကို တားဆီးခြင်း
- Save အောင်မြင်လျှင် first page ပြန်စခြင်း၊ stale parent error နောက် options refresh ဖြစ်ခြင်း
- Owner-only actions၊ status confirmation နှင့် root status ပြောင်းလဲမှုက children/products ကို မပြောင်းခြင်း
- Failure နောက် form values၊ keyboard focus၊ pending state နှင့် session/permission errors စစ်ခြင်း

Products အတွက် browser မှာ ဆက်စစ်ရန်—

- Name/SKU/barcode live search၊ exact category/status filters၊ pagination နှင့် no-results စစ်ခြင်း
- Owner ဖြင့် create/edit၊ base unit factor 1၊ unit အများဆုံး 3 ခု၊ duplicate SKU/barcode errors စစ်ခြင်း
- Edit တွင် base unit မပြောင်းနိုင်ခြင်း၊ changed fields သာ PATCH ပို့ခြင်း၊ omitted units ဆက်ရှိခြင်း စစ်ခြင်း
- Product-unit active flag နှင့် product status သီးခြားဖြစ်ခြင်း၊ inactive shared unit ကို product-unit အဖြစ် ပြန်ဖွင့်မရခြင်း စစ်ခြင်း
- Background refresh network failure နောက် cached data ရှိလျှင် form values ဆက်ရှိခြင်း၊ retry အောင်မြင်ခြင်း စစ်ခြင်း
- Request failure နောက် inputs မပျောက်ခြင်း၊ save pending၊ 401/403/404 နှင့် Owner/Cashier access စစ်ခြင်း
- Cancel မှာ unsaved changes confirmation ပြခြင်း၊ keyboard နှင့် narrow viewport စစ်ခြင်း

Unsaved changes confirmation သည် form ၏ Cancel action အတွက်သာ ဖြစ်သည်။ Sidebar navigation နှင့် browser reload ကို မတားထားသေးပါ။

1. Foundation နှင့် styling ပြင်ဆင်ခြင်း
2. Authentication နှင့် browser cookie flow စစ်ဆေးခြင်း
3. Management layout နှင့် shared page states
4. Units → Categories → Products
5. Suppliers၊ Inventory နှင့် Purchasing
6. Sales history/detail နှင့် Staff management
7. လက်ရှိ integrations များကို ပြန်လည်စစ်ဆေးခြင်း

Feature တစ်ခုချင်းစီကို page/form → API integration → browser verification အထိ တည်ဆောက်မည်။ Checkout နှင့် ကျန် domain များကို သက်ဆိုင်ရာ backend contract အဆင်သင့်ဖြစ်မှ ဆက်လက်ချိတ်ဆက်မည်။

UI သည် light theme၊ neutral surfaces နှင့် emerald accent ကို အသုံးပြုမည်။ API မရှိသေးသော metrics၊ charts နှင့် လုပ်ဆောင်၍မရသော controls များ မထည့်ပါ။

