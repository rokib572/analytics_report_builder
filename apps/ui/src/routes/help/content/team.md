# Team management

The **Team** page lets owners and admins manage who has access to the workspace and what each member can see.

![Team list](/images/help/team/team-list.png)

## Roles at a glance

There are three roles you can assign inside your workspace:

- **Owner** — created on signup. Full workspace access, including user management. Cannot be removed.
- **Admin** — full data access for day-to-day operations. Can add and manage users. Cannot remove the owner.
- **Member** — access is limited to the specific resources granted via per-user permissions.

Owners and admins **bypass per-resource permission checks** — they always see every page and dataset within their workspace. Members are gated by the permissions you set per resource.

## Inviting teammates

1. Open **Team** from the sidebar.
2. Click **Invite User**.
3. Enter the teammate's email and pick **Member** or **Admin**.
4. Click **Create Invitation**.

If SMTP is configured, AperioBI sends an invitation email. Otherwise the invitation link is shown on screen — copy it and share it directly.

![Invite a member](/images/help/team/invite-member.png)

Pending invitations appear at the bottom of the page with their expiry date and a **Revoke** action. Once accepted, the user appears under **Team Members**.

## Permissions

Members can be granted access per resource and per action. Open **Manage permissions** on a member's row to see the matrix.

![Manage permissions](/images/help/team/manage-permissions.png)

Resources you can grant access to:

- `sales` — sales data endpoints
- `locations` — Locations browsing
- `orders` — Orders list and detail
- `inventory` — Inventory page
- `square-customers` — synced Square customers
- `reports` — Report Builder and saved reports
- `sync` — sync-related operations
- `users` — team management
- `api_keys` — legacy / future credential resource

Each resource supports four actions: **view**, **create**, **update**, **delete**.

> Tick the boxes the member needs and click **Save**. The matrix is bulk-updated in one request, so unchecked rows revoke previously granted access.

## Reminders

- **Owners** and **admins** override the matrix entirely — all checkboxes are effectively "on" for them.
- **Members** see a sidebar item only if they have the `view` permission for its underlying resource.
- A user must have `reports:view` to even open the Report Builder, and `inventory:view` for the Inventory page, etc.
- If someone says they "can't see a page," check their **role** first, then their **permission row** for that resource.
