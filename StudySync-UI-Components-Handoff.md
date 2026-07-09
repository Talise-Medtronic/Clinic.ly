# StudySync App MAS - GUI Components Handoff

This document summarizes the GUI structure of the MAS StudySync Angular app in this monorepo so teams can replicate the same look and UX patterns.

## 1. App Location

- App project: apps/mas/studysync-app
- Nx project config: apps/mas/studysync-app/project.json
- Source root: apps/mas/studysync-app/src

## 2. Main Routes and Screens

Based on apps/mas/studysync-app/src/app/app.routes.ts:

- /about
  - About/sign-in landing page
- /home
  - Dashboard with management cards and quick actions
- /special-uses
  - Special Uses table list with filter panel and add action
- /special-uses/:id
  - Special Use detail view with Content, Application IDs, and Users sections
- /administrator and /administrator/:id
  - Administrator route, restricted to StudySync administrator role

## 3. Shell and Navigation Components

- Main shell wrapper with top app chrome and category navigation:
  - apps/mas/studysync-app/src/app/main/main.component.ts
- Route content rendered inside shell:
  - apps/mas/studysync-app/src/app/main/main.component.html
- Shared shell module from component library:
  - libs/components/core/src/lib/main-shell

## 4. Screen-Level UI Components

## 4.1 About Screen

Files:
- apps/mas/studysync-app/src/app/main/about/about.component.ts
- apps/mas/studysync-app/src/app/main/about/about.component.html

Visible elements:
- Branding/logo
- Product title and copy text
- Sign-in button
- Basic legal/footer text

## 4.2 Home Dashboard

Files:
- apps/mas/studysync-app/src/app/main/home/home.component.ts
- apps/mas/studysync-app/src/app/main/home/home.component.html
- apps/mas/studysync-app/src/app/main/home/home.component.scss

Visible elements:
- Welcome header with username
- Quick Navigation card grid
- Management cards with icon + title + action rows:
  - Special Use Management
  - Tablet Management
  - Content Management
  - User Management
- Role-aware action buttons with locked icon and tooltip when access is not allowed

## 4.3 Special Uses List

Files:
- apps/mas/studysync-app/src/app/main/special-uses/special-uses.component.ts
- apps/mas/studysync-app/src/app/main/special-uses/special-uses.component.html
- apps/mas/studysync-app/src/app/main/special-uses/special-uses.component.scss

Visible elements:
- Page title
- Data-table toolbar with search and filter toggle
- Add Special Use mini FAB action
- Collapsible filter panel
  - Type selection list
  - Show/Hide expired selection
  - Apply and Clear actions
- Data table columns:
  - Name
  - Type
  - Expiration (UTC)
  - Created On
- Expired badge flag on rows
- Empty-state message

## 4.4 Special Use Detail

Files:
- apps/mas/studysync-app/src/app/main/special-use/view-special-use/view-special-use.component.ts
- apps/mas/studysync-app/src/app/main/special-use/view-special-use/view-special-use.component.html
- apps/mas/studysync-app/src/app/main/special-use/view-special-use/view-special-use.component.scss

Visible elements:
- Loading progress bar
- Header card
  - Feature name
  - Expired warning flag
  - Edit action
  - Key-value details: Description, Type, Expiration Date (UTC)
- Content card
  - Add action
  - Reusable radial list for content rows
- Application IDs card
  - Edit and Add actions
  - Reusable radial list with edit mode actions
- Users card
  - Edit and Add actions
  - Reusable radial list with edit mode actions

## 4.5 Administration

Files:
- apps/mas/studysync-app/src/app/main/administration/administration.component.ts

Visible elements:
- Admin route container (currently minimal/stub)

## 5. Shared/Reused UI Building Blocks

## 5.1 App Shared Components

Files under:
- apps/mas/studysync-app/src/app/main/shared

Important components:
- special-use-form
  - Name, description, type, expiration form
- content-form
  - Dynamic content item form rows
- radial-list
  - Generic list/table with pagination and selectable/edit mode
- overflow-tooltip-directive
  - Tooltip only when content overflows

## 5.2 Core Shared Libraries

Files under:
- libs/components/core/src/lib

Used UI modules/components:
- main-shell
- table and table-toolbar
- filter-panel
- avatar
- radial-list support

## 5.3 Rhythm UI Component Set (Material Legacy wrappers)

Used from:
- libs/rhythm/legacy-*

Common controls in StudySync app:
- button, card, icon, form-field, input, select, list, divider, flag
- table, tabs, checkbox, radio
- side-sheet, dialog, snack-bar
- progress-bar, tooltip
- key-value display

## 6. Styling and Theme System

Global style entry:
- apps/mas/studysync-app/src/styles.scss

Theme files:
- libs/rhythm/theme/core.scss
- libs/rhythm/theme/medtronic-theme.scss
- libs/rhythm/theme/colors.scss

Key visual tokens from colors.scss:
- navy fill: #140f4b
- electric blue 80: #0c0ca5
- primary base (40): #1010eb
- tertiary base (40): #cd0025
- neutral scale for surfaces/text from dark to white

Observed visual patterns:
- Card-based dashboard layout
- Icon badge + colored top bars on cards
- Accent flags for expired state (light red background)
- Dense enterprise table patterns with sorting/filtering/search
- Side sheets for create/edit workflows

## 7. Interaction Patterns to Replicate

- Role-based enable/disable and visibility of actions
- Add/Edit flows launched from side sheets
- Inline and tooltip affordances for access restrictions
- Table toolbar pattern: search + filter + action button
- UTC date labeling for expiration fields
- Expired-state lockout for editing
- Success/error feedback via snackbar/alerts

## 8. Suggested Minimum Component Set for New Project

To match this app look and UX, include at least:

- AppShell with header + side navigation
- HomeCardGrid with icon cards and action rows
- SpecialUsesTablePage with toolbar + filter panel + table
- SpecialUseDetailPage with 3 cards (Content, App IDs, Users)
- SideSheetForm framework for Create/Edit/Add flows
- RadialList reusable component
- ExpiredFlag and RoleLockedButton components
- Theme token file seeded with the color values above

## 9. Reference File Index

- apps/mas/studysync-app/src/app/app.routes.ts
- apps/mas/studysync-app/src/app/main/main.component.ts
- apps/mas/studysync-app/src/app/main/home/home.component.html
- apps/mas/studysync-app/src/app/main/home/home.component.scss
- apps/mas/studysync-app/src/app/main/special-uses/special-uses.component.ts
- apps/mas/studysync-app/src/app/main/special-uses/special-uses.component.html
- apps/mas/studysync-app/src/app/main/special-use/view-special-use/view-special-use.component.ts
- apps/mas/studysync-app/src/app/main/special-use/view-special-use/view-special-use.component.html
- apps/mas/studysync-app/src/app/main/shared/radial-list/radial-list.component.ts
- libs/components/core/src/lib/main-shell
- libs/rhythm/theme/colors.scss
- libs/rhythm/theme/medtronic-theme.scss
