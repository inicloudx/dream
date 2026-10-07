# Azure journal — dream

What was built on Azure, in order, and why. Each service is explained with the "house" picture:
the resource group is the house, and every service is something in it.

## The services (October 2026)

| Service | Name | In the house | What it does for dream |
|---|---|---|---|
| Resource group | `rg-dream-dev-cin` (Central India) | The house | Everything for dream lives here |
| Policy | Allowed locations = Central India, Deny, **subscription scope** | House rules | Nothing can be created outside Central India |
| Log Analytics workspace | `log-dream-dev-cin` | The diary | Stores every record: visits, errors, slow pages |
| Application Insights | `appi-dream-dev-cin` | CCTV | Watches the app and writes into the diary |
| Container Registry | `crdreamdev` (Basic, admin user off) | Storeroom | Holds the packed program (`viewer:v1`) |
| PostgreSQL flexible server | `psql-dream-dev-cin` (B1ms, v18), database `viewer` | Cupboard with a drawer per service | Stores the data each service writes |
| Key Vault | `kv-dream-dev-cin` (RBAC) | Safe | Holds `database-url` and `stats-password` |
| App Service plan | `asp-dream-dev-cin` (B1) | The rented computer | Runs the web apps; one plan can run several apps |
| Web app | `app-dream-viewer-dev-cin` | One program on that computer | The viewer service: gift pages, creator, stats |

## The wiring

| Wire | Connects | Set in |
|---|---|---|
| 1. Badge (managed identity) | Gives the web app its own identity | Web app → Identity → System assigned → On |
| 2. Storeroom permission | Badge may pull images (AcrPull) | Registry → Access control (IAM) |
| 3. Safe permission | Badge may read secrets (Key Vault Secrets User) | Key Vault → Access control (IAM) |
| 4. Which secrets | `DATABASE_URL`, `STATS_PASSWORD` = `@Microsoft.KeyVault(VaultName=kv-dream-dev-cin;SecretName=...)` | Web app → Environment variables |
| 5. Which image | `viewer:v1`, pulled with the managed identity | Web app → Deployment Center → main |
| 6. Database address | Server, user, password and database name | Inside the `database-url` secret |
| 7. Database door | "Allow public access from any Azure service" | Database → Networking |
| 8. CCTV | `APPLICATIONINSIGHTS_CONNECTION_STRING` | Web app → Environment variables |
| 9. CCTV → diary | Application Insights stores data in `log-dream-dev-cin` | Chosen when creating Application Insights |
| 10. Plan | The web app runs on `asp-dream-dev-cin` | Chosen when creating the web app |

Wires 1–5 are identity wiring: **authentication** (the badge proves who the app is) and
**authorization** (role assignments say what it may do). Wires 6–9 are address wiring.

The code never talks to Key Vault. App Service fetches the secret with the app's badge and starts the
code with the real value in `DATABASE_URL`, so the same code runs on a laptop (`.env`) and on Azure.
After changing a secret, restart the app to pick it up immediately.

## Mistakes made and what they taught

- **Policy landed with the resource group as an exclusion.** The rule applied everywhere except the dream
  resource group, so a database was created in Canada Central. Fixed by removing the exclusion. Lesson:
  check a policy's scope and exclusions after assigning it.
- **Database created in Canada Central** (picked instead of Central India). A database cannot change region,
  so it was deleted and recreated. Lesson: read the Region field twice.
- **Web app and plan created in `DefaultResourceGroup-CID`.** Moved to `rg-dream-dev-cin` (a web app and its
  plan must move together). Lesson: check the Resource group field on every form.
- **The web app form created a duplicate Application Insights** named after the app. Deleted; the app now
  uses `appi-dream-dev-cin`. Lesson: check the Monitoring tab before clicking Create.
- **The app's Key Vault role was missing.** Without it the app cannot read its secrets. Added.
- **Image tag typed as `1` instead of `v1`.** The app looked for a box that didn't exist: 503.
- **The app's web address was pasted into `APPLICATIONINSIGHTS_CONNECTION_STRING`.** The monitoring library
  found no key and the program exited at startup (503, "exit code 1"). Found in
  `LogFiles/StartupLogs/*_failure.log`: "No instrumentation key or connection string was provided".
  Fixed by pasting the real connection string (starts with `InstrumentationKey=`). The code (v2) now only
  logs a warning for a bad monitoring setting instead of stopping the app.
- **Database password mismatch** ("password authentication failed for user dreamadmin", code 28P01) after the
  database was recreated. Fixed with one fresh letters-and-digits password: Reset password on the server, new
  version of the `database-url` secret.
- **The app kept using the old secret.** App Service caches Key Vault values for up to 24 hours, and a restart
  alone did not refetch. Changing the setting (to
  `@Microsoft.KeyVault(SecretUri=https://kv-dream-dev-cin.vault.azure.net/secrets/database-url/)`) forced a
  fresh fetch. Lesson for secret rotation: new version → refresh apps (Pull reference values or any setting
  change) → only then retire the old password.
- **"Tag already exists"** when copying the image: the copy had already worked. Azure refuses to overwrite
  a tag unless told to, which protects released versions.

## Live (7 October 2026)

`https://app-dream-viewer-dev-cin-esh9feezb0aad3gs.centralindia-01.azurewebsites.net` — all gift pages, the
creator and static files answer 200; `/stats/` asks for the password. Running `viewer:v1`.

## Troubleshooting a 503

1. Is the app pulling the right image? Deployment Center → main → image and tag.
2. Do Key Vault references resolve? Environment variables → Source column shows a green tick.
3. What did the program print before it stopped? Log stream, or `LogFiles/StartupLogs/*_failure.log`.
4. After several failed starts App Service blocks the app for a minute ("blocked due to multiple,
   consecutive cold start failures"); wait, then check again.

## Policy effects (interview point)

Deny prevents, Audit reports, Modify and DeployIfNotExists repair. A Deny policy does not remove resources
that already break the rule; they show as non-compliant under View compliance.
