## Platform Development for ND Project (Land Lot / Work Lot Management Platform)

### Kick-off Meeting Minutes

### 1. Meeting Details

- **Meeting Title**: Platform Development for ND Project – Kick-off Meeting
- **Date**: 29 January 2026 (Thursday)
- **Time**: 11:00 – 12:00 (HKT)
- **Mode**: Zoom (Online Meeting)
- **Project**: ND/2025/01 – San Tin Technopole Phase 1 Stage 1 (East) – Contract 2 (C2) related Land / Work Lot Management Platform

---

### 2. Attendance

**isBIM (Platform Development Team)**

- Eric Xiao (Project Lead / PM)
- Khalil Chiu (Project Coordinator)
- Rex Lau (BIM Team Leader)

**CEDD (Project / Client Team)**

- Victor Suen
- Cherry Suen

**LandsD (Lands Department)**

- Keith Pang
- W.H. Leung

**ABJV (Consultant / Site Management Team)**

- Victor Go (CRE)
- Humphrey Wu (SRE)
- Hon

**Kuly (IT / Site Support)**

- Tony Lo (Site IT support; company/role per contact list)

---

### 3. Purpose of Meeting

The meeting was convened to align all parties on the commencement of the **Land / Work Lot Management Platform** (Web Portal + Mobile App) for the ND Project, including:

1. confirmation of objectives, key use cases and preliminary scope;
2. alignment on delivery approach and schedule (approx. **6–8 weeks**, planned as **8 weeks**) and expectations for **first two-week deliverables** (prototype/demo);
3. clarification of required land boundary / BU / household data, availability, formats and accuracy limitations;
4. preliminary confirmation of deployment environment (C1 Site Server / Windows Server / VM), remote access and security arrangements; and
5. establishment of weekly working mode (weekly check-in / prototype review).

---

### 4. Key Discussion Points

### 4.1 Business Pain Points and Target Outcomes

All parties acknowledged that current land resumption and handover tracking requires substantial cross-checking across multiple datasets (land lots, BU/households, occupation/clearance status, handover progress, etc.). In a multi-party environment, mismatches frequently occur (e.g., whether a household/BU belongs to “Lot/Area A” or “Lot/Area B”), creating uncertainty and potential impact to the construction program. The platform is expected to provide map-based visibility so users can quickly identify which BU/households are associated with a given area/lot and their current status, and to provide prompts/indicators for difficult cases that could affect key programme dates (e.g., alerts/indicators).

### 4.2 Platform Scope and Core Components (Web + Mobile + GIS)

isBIM introduced that the solution will comprise:

- **Web Portal**: for office/management users to manage map viewing, layers, Work Lot creation/editing and status updates, task management, reporting and queries;
- **Mobile App**: for field/site staff to view assigned tasks, reference location via GPS, and retrieve information/status for a selected area on site.

The platform will be **GIS-driven**, using **Hong Kong CSDI (Common Spatial Data Infrastructure)** as the basemap (street/topographic) with project layers overlaid (e.g., ND/2025/01 project boundary, Land Lots, Work Lots, status layers, etc.) to deliver a “Google Maps-like” interaction model.

### 4.3 Positioning of “Land Lot” vs “Work Lot”

The meeting clarified that:

- **Land Lots** (cadastral boundaries, typically from LandsD) are important as background/reference data; however, they may not directly map to operational resumption/handover management units.
- The operational focus shall be **Work Lots** (site work boundaries/management areas). The system must allow users to define Work Lots by drawing/editing polygons and to maintain statuses (e.g., resumed, handed over to contractor, under construction, difficult cases, etc.).
    
    The platform should allow switching between layers so users can compare the legal cadastral view and the operational Work Lot/handover status view.
    

### 4.4 Data Complexity and Data Model Direction

It was agreed that in this project context:

- a single Land Lot may involve multiple operators; and
- a single operator may span across multiple Land Lots, or only occupy part of a Land Lot.
    
    Therefore, the data model must not assume 1:1 relationships. The system should support Work Lot-based associations (including grouping/relationships and multi-selection for operations) and use layers to differentiate between cadastral boundaries and practical operational boundaries.
    

### 4.5 Data Availability, Accuracy Constraints and Phase-1 Input Approach

While isBIM noted the system would benefit from coordinate data (easting/northing) and GIS/CAD formats, it was clarified that precise coordinates/setting-out information may not be fully available as surveying works are still ongoing. As a Phase-1 approach, all parties agreed to adopt **Soft Copy Plans** (North/South sections with indicative BU/household markings) as the initial reference layers. A “usable-first, refine-later” approach will be adopted, and data accuracy/indicative nature should be clearly marked in the system to avoid misinterpretation.

### 4.6 Limitations of Mobile GPS

Mobile GPS is for reference only and is subject to error; it must not be interpreted as survey-grade positioning. Final boundary judgement remains subject to established site verification procedures.

### 4.7 IT / Server Environment and Access (C1 Site Server)

The deployment will use **Site Server (C1)**. The environment is **Windows Server**, likely running on a **Virtual Machine (VM)**. Items to be confirmed and implemented include:

- remote access mechanism for deployment/testing (IP, ports, account privileges, etc.);
- security policy and approval workflow; and
- appointment of a site IT/technical support point-of-contact for direct technical coordination with isBIM (while administrative coordination remains through the nominated project contacts).

### 4.8 Delivery Approach and First Two-Week Deliverables

isBIM proposed an overall duration of **6–8 weeks (planned as 8 weeks)** with weekly prototypes/alignment:

- **Weeks 1–2**: architecture and environment setup; CSDI basemap integration; core map/layer capability; and provision of a visual **Prototype/Demo** for CEDD to review the look-and-feel and confirm functional direction.
- **Weeks 3–5**: parallel development of Web (layers/drawing/tasks) and Mobile baseline features.
- **Weeks 6–7**: security checks, QA, documentation, UAT preparation and handover arrangements (subject to progress).
    
    CEDD highlighted that a visible output within the first two weeks is required and suggested using a small set of resumed land cases for early demonstration/validation.
    

---

### 5. Decisions (Agreements Reached)

1. The project will proceed on an approx. **6–8 week** schedule (planned as **8 weeks**) with weekly prototype alignment; a visible **Prototype/Demo** shall be delivered within the first two weeks.
2. The platform will be centred on **CSDI basemap + overlay layers**, with **Work Lots** as the primary operational unit and **Land Lots** as reference layers.
3. The data model shall support complex non-1:1 relationships between Land Lots, operators, BU and households.
4. Phase-1 will adopt **Soft Copy Plans** (North/South sections with indicative BU/household markings) as initial input; coordinate/GIS precision data will be progressively incorporated later.
5. Server access and security arrangements (IP/ports/accounts/remote access) shall be expedited to avoid impact to the Weeks 1–2 foundation work.

---

### 6. Action Items

| Ref. | Action Item | Owner | Target |
| --- | --- | --- | --- |
| A1 | Issue a “Data Requirements List” including required drawings/lists/attribute fields and recommended formats (PDF/CAD/GIS/Excel, etc.) | isBIM (Eric) | Week 1 |
| A2 | Provide sample area / resumed land cases for Weeks 1–2 demo and validation | CEDD (Victor/Cherry) | Weeks 1–2 |
| A3 | Provide Soft Copy Plans (North/South sections) with BU/household markings; state indicative nature and update frequency | CEDD / Relevant parties (incl. LandsD/site team support) | Within ~1 week |
| A4 | Coordinate a site IT/technical support contact; provide server IP, accounts/permissions, remote access method and required firewall port openings | CEDD (Victor to coordinate) + Site IT (Tony, etc.) | Within ~1 week |
| A5 | Confirm deployment approach (Windows Server / VM), test environment, remote access and security requirements; complete foundation environment setup | isBIM + Site support team (Hon/Hong, Humphrey, etc.) | Weeks 1–2 |
| A6 | Produce a draft data model (Lot/Work Lot/Operator/BU/Household relationships, naming/IDs, grouping requirement) | isBIM (Eric) + CEDD | Weeks 2–3 |
| A7 | Provide preliminary user types/roles (admin/user/read-only, etc.) and estimate user count | CEDD + isBIM | Week 3 |
| A8 | Establish weekly check-in / prototype review cadence (time, attendees, acceptance approach) | isBIM + CEDD | Start immediately |
| A9 | Circulate finalized meeting minutes and project contact list | isBIM (Rex) | Immediate |

