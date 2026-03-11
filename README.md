### install

```
npm i express bcrypt mongo mongodb mongoose cors jsonwebtoken dotenv ejs express-rate-limit http-status multer node-cron nodemailer socket.io stripe validator winston winston-daily-rotate-file
```

### Documents

<details>
<summary>📌 Docs</summary>

</details>

---

### To Do

<details>
<summary>To do</summary>

1. show users posts based on their subscription plan done form backend
2. isSubscribed check on profile and get all posts
3. fix the login limiter

</details>

---

### New Features

<details>
<summary>🚀 New Features</summary>

1.

</details>

---

### modifications in figma

<details>
<summary>🖌 Modifications in Figma</summary>

1.

</details>

---

### commented code (consider uncommenting on production only)

<details>
<summary>🧪 Commented Code</summary>

1. stripe.service.js > postCheckout -- check if user is already subscribed

</details>

---

### fix code

<details>
<summary>🔧 Code Fixes</summary>

- Before completing a trip, calculate `tollFee` and add it to the final amount

</details>

---

### collections

<details>
<summary>🗃 Collections</summary>

1. auths
2. admins
3. users
4. notifications
5. payments

</details>

### stripe.service.js Changes (app-server branch)

### Branch Information

<details>
<summary>🌿 Branches</summary>

- **app-server**: App server specifically
- **main**: Website and admin dashboard
- **Note**: Both branches run on different IPs but share the same database

</details>


<details>
<summary>📝 Stripe Service Updates</summary>

#### Imports
- Added `EnumSubscriptionPlan` to destructured imports from enum utility

#### New Function: `updateSubscriptionStatusForAppUser`
A new ~90 line function that manages app user subscriptions with the following features:

**Payload Validation**
- `isSubscribed`
- `subscriptionType`
- `packageType`

**Unsubscribe Scenario**
- Clears user subscription data when all values are "no"
- Removes subscription plan, start/end dates, and package type

**Subscribe Scenario**
- Validates subscription type: `MONTHLY` | `YEARLY`
- Validates package type: `GOLD` | `SILVER` | `BRONZE`
- Calculates subscription end dates
- Updates user data
- Sends subscription email via `EmailHelpers.sendSubscriptionEmail()`
- Posts notifications to user and admins

#### Exports
- Added `updateSubscriptionStatusForAppUser` to StripeService exports

</details>

