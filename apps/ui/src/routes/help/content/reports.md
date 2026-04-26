# Report Builder

The Report Builder is a drag-and-drop canvas for exploring your synced Square data — sales, labor, waste, inventory units, and more. You can pivot, compare to a prior period, break down by channel, filter, save, and export the result.

This guide walks through the full feature set, top to bottom.

![Report Builder overview](/images/help/reports/builder-overview.png)

## Layout at a glance

The Report Builder has two top-level tabs:

- **Builder** — the canvas where you compose a report.
- **My Reports** — your saved reports, with **Open**, **Export**, and **Delete** actions.

The Builder canvas is split into two panels:

- **Field panel (left)** — draggable Metrics, Dimensions, and toggleable Location Attributes.
- **Canvas (right)** — date range, drop zones (Metrics / Rows / Columns), advanced toggles (YTD, channel breakdown, comparison), chart type, filters, and the live Preview.

The top action bar offers **Presets**, **Export**, and **Save**.

## Quick start

1. Open **Report Builder** from the sidebar.
2. Drag at least one metric (e.g. **Net Sales**) into the **Metrics** drop zone.
3. Drag a dimension (e.g. **Location** or **Sale Date**) into **Rows**.
4. Pick a date range (use a preset like **This Month** or set custom dates).
5. The Preview renders below as soon as the configuration is valid.
6. Click **Save** to keep the report, or **Export → CSV / PDF** to share it.

## Date range and presets

A row of preset buttons sits at the top of the canvas:

> **Today · Yesterday · This Week · Last Week · This Month · Last Month · This Year · Last Year · Custom**

Picking a preset locks the From / To inputs to the computed range. Picking **Custom** unlocks the inputs so you can choose exact dates. The default range when you open the builder is the **last 30 days**.

![Date range](/images/help/reports/date-range.png)

> Weeks here are ISO weeks (Monday is the first day).

## The field panel

The left panel holds three groups, each collapsible:

- **Metrics** — what you want to measure.
- **Dimensions** — how you want to slice it (rows or columns).
- **Location Attributes** — extra columns about each location (only effective when **Location** is in Rows).

Drag a metric or dimension onto the canvas to add it. Already-active fields show as dimmed in the panel.

![Field panel](/images/help/reports/field-panel.png)

### Metrics

Metrics are organised into three families:

**Sales**

| Metric            | What it measures                                                         |
| ----------------- | ------------------------------------------------------------------------ |
| Net Sales         | Gross sales after discounts and returns, before tax/tips/service charges |
| Gross Sales       | Item totals before any discounts or returns                              |
| Order Count       | Number of completed orders                                               |
| Store Gross Sales | Gross sales restricted to in-store / non-delivery channels               |
| Total Discounts   | Sum of discounts applied                                                 |
| Total Tax         | Sum of tax collected                                                     |
| Total Tips        | Sum of tips received                                                     |
| Total Collected   | Net Sales + Tax + Tips + Service Charges                                 |
| Units Sold        | Total line-item quantity (line-item level)                               |

**Labor**

| Metric                        | What it measures                      |
| ----------------------------- | ------------------------------------- |
| Reported Labor Hours          | Hours actually worked from timecards  |
| Template Labor Hours          | Hours scheduled via templates         |
| Labor Hour Variance           | Reported − Template                   |
| Labor Hour Variance %         | Variance as a percentage of Template  |
| Reported Training Hours       | Training hours pulled from timecards  |
| Estimated Payroll (After Tax) | Reported pay × (1 − payroll tax rate) |
| Payroll % of Sales            | Estimated Payroll ÷ Net Sales         |
| Cost per Labor Hour           | Labor cost ÷ Reported Labor Hours     |

**Waste**

| Metric           | What it measures                                      |
| ---------------- | ----------------------------------------------------- |
| Waste Items      | Item count moved to a Waste state in Square inventory |
| Waste Cost       | Cost value of those wasted items                      |
| Waste % of Sales | Waste Cost ÷ Net Sales                                |

> Waste comes from Square inventory adjustments where the destination state is `WASTE`. There is no separate waste table.

### Dimensions

Drag a dimension into **Rows** to group results, or into **Columns** to pivot.

| Dimension           | Notes                          |
| ------------------- | ------------------------------ |
| Location            | Per Square location            |
| Sale Date           | Per calendar day               |
| Day of Week         | Mon–Sun aggregate              |
| Year / Week / Month | Computed time buckets          |
| Customer            | Square customer name           |
| Product             | Catalog item (line-item level) |
| Product Category    | Catalog item category          |
| Payment Method      | Tender type (card, cash, etc.) |
| Job Title           | From the labor query           |

> **Channel** is _not_ in the draggable dimension list. To split a metric by channel use the **Break down by channel** toggle (see below). Channel is still respected by filters and presets.

#### Compatibility rules

The builder enforces two rules and shows a red banner when a configuration would break them:

- **Product / Product Category cannot mix with Payment Method** in the same report — they live in different query modes.
- **Cross-mode pivot conflict**: when both Rows and Columns require an order-level query, both sides have to use dimensions from the same mode (line-items or tenders).

If you see the banner, drop one of the offending dimensions and re-add a compatible one.

### Location attributes

When **Location** is in Rows, you can append two extra columns:

- **Days Open** — count of distinct days the location had at least one sale in the date range.
- **Date Opened** — the first sale date on record for that location.

These appear as checkboxes under the dimensions list and become non-effective if you remove Location from Rows.

## Drop zones: Metrics, Rows, Columns

The center of the canvas has three drop zones. Each shows a dashed outline that highlights as you drag a field over it.

![Drop zones](/images/help/reports/drop-zones.png)

- **Metrics** — drag any number of metrics here. Click the × on a metric chip to remove it.
- **Rows** — group results vertically. Add multiple to nest groupings (e.g. Location → Sale Date).
- **Columns** — pivot the metric values across the column dimension's distinct values.

When you put a dimension in **Columns**, every metric becomes one column per distinct value of that dimension, plus the row dimension(s) on the left.

> Pivot has a **50-coordinate cap**. If a column dimension would produce more than 50 distinct values for the date range, the query rejects with a clear error — narrow the date range or pick a less granular column.

### Pivoting product onto columns (special case)

Dragging **Product** onto Columns automatically adds **Units Sold** as a metric (you can still uncheck it). This is the most common product pivot — units-sold per product across rows.

![Pivot table example](/images/help/reports/pivot-table.png)

## Inline YTD columns

Once you have at least one metric and a row dimension, the **Inline YTD Columns** panel appears with a checkbox for each metric. Tick a metric to add a paired **YTD <metric>** column right next to the period value.

Inline YTD computes from **January 1 of the same year as the date-range end** through the end of the range.

![Inline YTD](/images/help/reports/inline-ytd.png)

A second toggle — **YTD Products** — appends a YTD product breakdown when Product is part of the pivot.

> YTD columns only render when at least one row dimension is selected.

## Break down by channel

For metrics that support it (currently **Net Sales** and **Gross Sales**), you can split the value into one column per synced channel plus a grand-total column.

![Channel breakdown](/images/help/reports/channel-breakdown.png)

The toggle only shows the eligible metrics you've already added. Channels are derived from your synced order data — there's no hard-coded list.

## Prior-Period Comparison

Below the YTD panel, the **Prior-Period Comparison Column** lets you pull the same metric over a second date range and place it next to the primary period.

1. Pick a comparison range using the same preset row, or set custom dates.
2. Tick the metrics you want to compare.
3. Optionally tick **YTD** to add a year-to-date column for the comparison period.
4. With YTD ticked, you can also tick **YOY** to add a year-over-year column.

![Prior-period comparison](/images/help/reports/prior-period-comparison.png)

Comparison metric checkboxes are disabled until both the **From** and **To** comparison dates are set.

## Payroll Tax Rate

When **Estimated Payroll (After Tax)** is in your metrics, a Payroll Tax Rate input appears. The default is **14%** and the field clamps to 0–100%. AperioBI applies this rate when computing estimated payroll from reported labor cost.

![Payroll tax rate](/images/help/reports/payroll-tax.png)

## Chart type

Three chart types are available:

- **Table** — paginated table with **Load More** at the bottom (rows append without reloading prior pages).
- **Bar** — bar chart per metric, paginated with **Previous / Next** buttons.
- **Line** — line chart per metric, same pagination.

Charts use the first row dimension as the X-axis. They render the current page only to keep the preview bounded; the full data is still available via Export.

![Preview chart](/images/help/reports/preview-chart.png)

## Filters

Add filters with **+ Add Filter** in the Filters section. Two types are supported:

**Dimension filters** (multi-select):

- Location, Channel, Customer, Product, Product Category

The picker fetches options from your synced data — locations, detected channels, product names, categories, and Square customers.

**Metric filters** (numeric):

- Net Sales, Reported Labor Hours, Estimated Salary
- Operators: **equals**, **greater than**, **less than**, **between**

![Filters](/images/help/reports/filters.png)

Filters are AND-combined and are evaluated server-side, so they also affect totals, pivots, and YTD columns.

## Presets

The **Presets** button in the top action bar applies a curated configuration to the canvas. Today there is one preset:

- **Daily Operations Report** — location-by-location daily snapshot with sales, labor (template + reported, variance, payroll), waste, units sold, prior-year comping sales, and YTD columns. Channels marked as Uber are excluded automatically.

![Preset picker](/images/help/reports/preset-picker.png)

> Applying a preset replaces the current configuration. The builder confirms before overwriting if the canvas already has metrics.

## Saving and reopening reports

Click **Save** to give the current canvas a name and store it. Saved reports include the full configuration — metrics, rows, columns, filters, comparisons, YTD toggles, payroll rate, and chart type.

Open the **My Reports** tab to see all saved reports, sorted by last update. Each row offers:

- **Open** — load the configuration back into the canvas.
- **Export** — download as CSV or PDF without opening it.
- **Delete** — remove the saved report.

![Saved reports list](/images/help/reports/saved-reports.png)

Saved reports respect tenant boundaries: only people in your customer can see them. Members need the `reports:view` permission to access the Report Builder at all.

## Exporting

The **Export** dropdown produces:

- **CSV** — flat tabular export including pivot columns and comparison columns.
- **PDF** — landscape PDF rendered with `@react-pdf/renderer`, sized to fit the report's column count.

Export uses the current canvas configuration — including filters, comparisons, and pivots — and runs a fresh query so the file matches what you see.

![Export menu](/images/help/reports/export-menu.png)

> Export is disabled until you have at least one metric and either a row or column dimension.

## Tips and gotchas

- Start with a narrow date range when exploring a new question — it's faster, and pivots are less likely to hit the 50-coordinate cap.
- **Save** before switching tabs if you want to keep the configuration; the canvas is not auto-persisted.
- The Preview shows pages of `100` rows. The first page returns immediately; **Load More** appends the next page for tables.
- If a metric looks off, give it a refresh — recent activity flows in via webhooks, and the nightly re-sync at 2 AM catches anything missed.
- Rename labels for comparison columns by saving and editing the report config (advanced).

## Glossary

- **Gross sales** — total of item prices before any discounts or returns.
- **Net sales** — gross sales after discounts and returns, before tax, tips, and service charges.
- **Total collected** — net sales plus tax, tips, and service charges (what actually came in).
- **Tender** — how a payment was made on an order (card, cash, gift card, etc.).
- **Channel** — the originating source of an order (e.g. POS, online). Detected from synced order data, not a hard-coded list.
- **Pivot** — turning a dimension's distinct values into columns. Capped at 50 coordinates.
- **YTD** — year-to-date, computed from Jan 1 of the date-range end's year.
- **YOY** — year-over-year, comparing the same range one year earlier.
