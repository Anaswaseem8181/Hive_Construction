# Hive Construction Project - Structure aur Flow

Yeh file project ki overall structure aur workflow Roman Urdu mein explain karti hai.

## 1. Project ka Khaka

### Root Folder
- `package.json` - dependencies aur npm scripts rakhta hai.
- `vite.config.js` - Vite build aur development server config.
- `tailwind.config.js` - Tailwind CSS ke custom themes aur background images.
- `postcss.config.js` - CSS post-processing settings.
- `index.html` - React app ka HTML entry point.
- `README.md` / `FOLDER_STRUCTURE.md` / `FILES_SUMMARY.md` - documentation files.
- `.eslintrc.json` - linting rules.
- `.gitignore` - git ignore patterns.
- `public/` - static assets jaise images.
- `src/` - main React source code.

## 2. `src/` ka Structure

### `src/main.jsx`
Yeh React app ka entry point hai. Yeh `App` component ko browser ke DOM mein render karta hai.

### `src/App.jsx`
Yeh main component hai jahan routing define hoti hai. Is mein React Router DOM use ho rahi hai:
- `/` - Home page
- `/properties` - Properties page
- `/login` - Login page
- `/register` - Register page
- `/forget-password` - Password reset page
- `/verify-otp` - OTP verification page
- `/profile` - User profile
- `/investor-dashboard` - Investor dashboard
- `/investments` - Investments page
- `/admin-dashboard` - Admin dashboard

Yahan protected routes bhi hain jo user auth aur admin role check karte hain.

### `src/index.css`
Global CSS styles yahan rakhe gaye hain. Tailwind directives aur kuch custom utility classes bhi yahan define hain jaise:
- `.btn-primary`
- `.btn-secondary`
- `.card-hover`
- `.animate-slide-in`

## 3. `src/layouts/`

### `MainLayout.jsx`
Yeh wrapper layout hai jo har page ko navbar aur footer ke saath surround karta hai. Isi layout ke andar page components render hote hain.

## 4. `src/pages/`
Yahan app ke alag-alag pages rakhe gaye hain.

- `HomePage.jsx` - landing page jahan hero section, featured properties, aur service highlights dikhaye jate hain.
- `PropertiesPage.jsx` - property listing page jahan property cards dikhaye jate hain.
- `LoginPage.jsx` - login form aur auth logic.
- `RegisterPage.jsx` - user registration form.
- `ForgetPassword.jsx` - password reset flow.
- `OTPVerifyPage.jsx` - OTP verification page.
- `Profile.jsx` / `ProfilePage.jsx` - user profile section.
- `InvestorDashboard.jsx` - investor dashboard analytics aur summary.
- `AdminDashboard.jsx` - admin panel jahan admin overview aur stats milte hain.
- `InvestmentsPage.jsx` - investments tracking aur history.
- `PropertyInvestorsPage.jsx` - property-specific investor details.

## 5. `src/components/`
Yeh reusable UI components hain jo multiple pages mein use hotay hain.

- `Navbar.jsx` - navigation menu, login/register links, aur responsive behavior.
- `Footer.jsx` - page footer.
- `PropertyCard.jsx` - property details card jo properties list mein use hota hai.
- `SummaryCard.jsx` - dashboard stats card.

### `src/components/investment/`
- `FundingProgressBar.jsx` - progress bar for investment funding.
- `InvestmentCard.jsx` - investment item display.
- `InvestmentModal.jsx` - modal form for investment actions.
- `InvestorTable.jsx` - table showing investor data.
- `PortfolioSummary.jsx` - investment portfolio summary.

## 6. Data aur API structure

### `src/APis/`
Yeh folder API aur axios configuration deta hai:
- `axios.js` - axios instance configuration.
- `auth/auth.js` - authentication related API calls.
- `investment/investment.js` - investment related API calls.
- `property/property.js` - property related API calls.

Yeh folder is design ka hissa hai jahan backend se data fetch karne ka logic centralize kiya gaya hai.

## 7. `public/` folder
Yeh static assets rakhta hai. Sab se important background image:
- `public/images/semicircular-building-over-sky-photo.webp`

Yeh image `tailwind.config.js` mein custom backgrounds ke liye use hoti hai.

## 8. App Flow aur Approach

### User flow
1. User landing page (`HomePage`) pe aata hai.
2. Navbar se login/register ya properties dekh sakta hai.
3. Login karne ke baad protected routes open hoti hain.
4. Investor user `InvestorDashboard` aur `InvestmentsPage` access karta hai.
5. Admin user `AdminDashboard` access karta hai.
6. `MainLayout` common layout provide karta hai jisme Navbar aur Footer hotay hain.

### Data flow
- App mein localStorage se user auth check hoti hai.
- `App.jsx` mein `isAuthenticated()` aur `isAdmin()` functions route protection handle karte hain.
- Pages aur components state ke liye React hooks (`useState`, `useEffect`) use karte hain.
- API calls ke liye `src/APis/` folder maintain kiya gaya hai.

### Styling approach
- Tailwind CSS use hui hai for fast styling.
- Global CSS `index.css` mein base styles, custom animations, aur utility classes add ki gayi hain.
- Components mein Tailwind classes inline JSX mein use hoti hain.

### Architecture approach
- Page components `src/pages/` mein rakhe gaye hain.
- Reusable UI parts `src/components/` mein rakhe gaye hain.
- Layout wrapper `MainLayout.jsx` se consistency aur shared UI ensure hoti hai.
- API logic alag folder `src/APis/` mein rakha gaya taake backend calls modular rahen.

## 9. Summary
Yeh project React + Vite + Tailwind stack use karta hai. Structure clean hai:
- `src/` mein main code.
- `public/` mein static assets.
- `tailwind.config.js` mein theme customizations.
- `App.jsx` mein routing aur auth protection.
- Reusable components alag folder mein.

Is `read.md` file se aapko project ka flow aur architecture Roman Urdu mein samajh mein aa jana chahiye.
