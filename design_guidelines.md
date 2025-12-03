# VideoVault Design Guidelines

## Design Approach: Material Design System
**Rationale:** VideoVault is a utility-focused, dashboard-heavy application requiring consistent UI patterns, data-dense layouts, and clear visual hierarchy. Material Design provides the structured component library needed for complex role-based interfaces while maintaining familiarity for users transitioning from YouTube-style platforms.

## Typography System

**Font Family:** Inter (via Google Fonts CDN)
- Primary: Inter for all UI text
- Monospace: JetBrains Mono for video IDs/technical data

**Type Scale:**
- Display: 32px/bold - Dashboard headers
- Heading 1: 24px/semibold - Section titles  
- Heading 2: 20px/semibold - Card headers
- Body Large: 16px/regular - Primary content
- Body: 14px/regular - Secondary text, descriptions
- Caption: 12px/medium - Labels, metadata, timestamps
- Small: 11px/regular - Helper text

## Layout System

**Spacing Units:** Tailwind units of 1, 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: mb-8, mb-12  
- Card gaps: gap-6, gap-8
- Form fields: space-y-4

**Grid System:**
- Video grid: 3 columns desktop (grid-cols-3), 2 tablet (md:grid-cols-2), 1 mobile
- Dashboard cards: 2 columns desktop, 1 mobile
- Max container width: max-w-7xl with px-6

## Component Library

### Navigation
**Top Bar:**
- Fixed header with search bar (centered, max-w-2xl)
- Logo/brand left, user avatar/role badge right
- Height: h-16
- Search: Rounded full-width input with icon, focus ring

**Sidebar:**
- Fixed left sidebar, w-64 desktop, collapsible mobile
- Navigation items with icons (Heroicons)
- Active state: subtle background, border-left accent
- Role-specific menu items with section dividers

### Video Components
**Video Card:**
- Aspect ratio 16:9 thumbnail container
- Title: 2-line clamp, font-semibold
- Metadata row: uploader name, timestamp, view count
- Verification badge overlay (top-right corner):
  - Green: "✓ Verified by [VIP Name]" with checkmark icon
  - Red: "✕ Rejected by [VIP Name]" with X icon
  - Default: No badge
- Hover: Subtle elevation increase

### Dashboard Elements
**VIP Profile Cards:**
- Circular avatar: w-16 h-16
- Name, title, country stacked
- Status indicator dot
- Simple login form below profile

**Request Lists:**
- Table layout for admin/VIP dashboards
- Columns: Thumbnail, Title, Requester, Date, Actions
- Action buttons: Icon + text, inline spacing gap-2
- Approve (green), Reject (red), Ignore (neutral)

**Upload Interface:**
- Drag-and-drop zone: Dashed border, centered icon/text
- VIP selector: Multi-select dropdown (when authorized)
- Progress bar during upload
- Instant preview after upload

### Forms & Inputs
**Standard Input Fields:**
- Height: h-12
- Border radius: rounded-lg
- Focus: Ring outline
- Labels: Above input, text-sm font-medium
- Helper text below: text-xs

**Buttons:**
- Primary: Solid, rounded-lg, px-6 py-3
- Secondary: Outline, same dimensions
- Icon buttons: Square, p-3
- Hover/active states: Built-in component behavior

**Passkey Registration Section:**
- Card-based UI with icon
- Step-by-step flow indicators
- Biometric icon (fingerprint/face)
- Success/error states with icons

### Badges & Tags
- Pill shape: rounded-full, px-3 py-1
- Text: text-xs font-medium
- Role badges: Admin, Creator, VIP (distinct treatments)
- Status indicators: Approved, Pending, Rejected

### Data Display
**Video Grid:**
- Gap: gap-6
- Responsive: 3→2→1 columns
- Consistent card heights

**Dashboard Metrics:**
- Stat cards in 2-4 column grid
- Large number display with label below
- Icon accent top-right

## Interaction Patterns

**Passkey Challenge:**
- Modal overlay with biometric prompt
- Clear explanation text
- Loading state during verification
- Success/failure feedback

**Video Selection:**
- Checkbox multi-select for VIP assignment
- Selected count indicator
- Clear selection action

**Search:**
- Live filtering as user types
- Results update video grid instantly
- Clear search button when active

## Accessibility
- WCAG AA contrast ratios throughout
- Keyboard navigation for all interactive elements
- Focus indicators on all controls
- ARIA labels for icon-only buttons
- Form field error states with descriptive text

## Images

**VIP Profile Photos:** 5 circular headshot placeholders (professional business portraits)
- Placement: Dashboard sidebar, request lists, verification badges
- Format: Circular crop, consistent lighting

**Video Thumbnails:** Placeholder images for uploaded videos
- Aspect ratio: 16:9
- Placement: Video grid cards, dashboard tables
- Treatment: Slight rounded corners (rounded-lg)

No large hero images. This is an application interface focused on content density and functionality.