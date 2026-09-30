# Master Antigravity Skills Index & Catalog
**Total Skills Discovered:** 106
**Indexed Locations:** `~/.gemini/config/skills`, `~/.gemini/config/plugins`, `~/.gemini/antigravity-ide/builtin/skills`

---

### 1. `accidental-data-loss-prevention`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\accidental-data-loss-prevention`](file:///C:/Users/Sri/.gemini/config/skills/accidental-data-loss-prevention)
- **Purpose:** **STOP AND VERIFY**: Before running any command or tool that results in irreversible data loss, you MUST obtain explicit user consent. When in doubt, ask. It is better to wait for confirmation than to accidentally delete production data or critical project assets. Use this for: - SQL: DROP TABLE/VIEW/SCHEMA/DATABASE, TRUNCATE, or broad DELETE (missing WHERE or using 1=1). - Cloud Storage: gsutil rm or gcloud storage rm targeting production data or critical buckets. - Infrastructure: gcloud projects delete, deleting Spanner/BigQuery/Dataproc resources, deleting secrets, or KMS key destruction.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 2. `accidental-data-loss-prevention`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\accidental_data_loss_prevention`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/accidental_data_loss_prevention)
- **Purpose:** **STOP AND VERIFY**: Before running any command or tool that results in irreversible data loss, you MUST obtain explicit user consent. When in doubt, ask. It is better to wait for confirmation than to accidentally delete production data or critical project assets. Use this for: - SQL: DROP TABLE/VIEW/SCHEMA/DATABASE, TRUNCATE, or broad DELETE (missing WHERE or using 1=1). - Cloud Storage: gsutil rm or gcloud storage rm targeting production data or critical buckets. - Infrastructure: gcloud projects delete, deleting Spanner/BigQuery/Dataproc resources, deleting secrets, or KMS key destruction.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 3. `agent-learner`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\agent-learner`](file:///C:/Users/Sri/.gemini/config/skills/agent-learner)
- **Purpose:** Autonomous episodic memory and continuous learning engine. Auto-records debugging lessons, user preferences, and mistake patches into global and workspace memory to prevent repeating errors across sessions.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 4. `agy-customizations`
- **Path:** [`C:\Users\Sri\.gemini\antigravity-ide\builtin\skills\agy-customizations`](file:///C:/Users/Sri/.gemini/antigravity-ide/builtin/skills/agy-customizations)
- **Purpose:** >- Comprehensive guide and reference for the Antigravity Customization System. Use to explain how customizations work, their loading priority, discovery mechanisms, and to guide the creation of skills, rules, plugins, hooks, and MCP servers.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 5. `ai-agent-architect`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\ai-agent-architect`](file:///C:/Users/Sri/.gemini/config/skills/ai-agent-architect)
- **Purpose:** Architect autonomous AI agents, multi-agent swarms, tool-use execution loops, and automated browser workflows. Covers patterns from OpenHands, Browser-Use, ScrapeGraphAI, E2B sandboxes, and Manus-style planning/execution engines.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 6. `alphafold-database-fetch-and-analyze`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\alphafold_database_fetch_and_analyze`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/alphafold_database_fetch_and_analyze)
- **Purpose:** > Retrieve and analyze AlphaFold predicted structures for a protein. Use when the user provides a specific UniProt Accession ID and wants structural confidence metrics (pLDDT), domain boundary analysis, or disorder assessment. Do not use if the user only has a protein name, gene name, or amino acid sequence — ask for a UniProt ID first.
- **Included Subfolders:** `scripts/` (3 items: analyze_pae.py, analyze_plddt.py, fetch_structure.py); `references/` (1 items: citation.bib)

### 7. `alphagenome-single-variant-analysis`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\alphagenome_single_variant_analysis`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/alphagenome_single_variant_analysis)
- **Purpose:** > Analyzes genetic variant effects on gene expression (RNA-seq), chromatin accessibility (DNASE), histone marks (ChIP), and transcription factors using the AlphaGenome API. Use when the user asks about non-coding variant effects, pathogenicity, clinical significance, disease associations, functional effects, gene expression changes, splicing disruption, or regulatory effects in promoters and enhancers. Also use for resolving biological terms to tissue/cell-type ontologies (UBERON/CL) or analyzing variants in chr:pos:ref>alt format.
- **Included Subfolders:** `scripts/` (7 items: analyze_ism.py, generate_ontology_mapping.py, interpret_splicing.py, lookup_gene_info.py, ... (+3 more)); `references/` (1 items: citation.bib)

### 8. `android-cli`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\android-cli-plugin\skills`](file:///C:/Users/Sri/.gemini/config/plugins/android-cli-plugin/skills)
- **Purpose:** Orchestrates Android development tasks including project creation, deployment, SDK management, and environment diagnostics using the `android` command-line tool.
- **Included Subfolders:** `references/` (2 items: interact.md, journeys.md)

### 9. `antigravity-guide`
- **Path:** [`C:\Users\Sri\.gemini\antigravity-ide\builtin\skills\antigravity_guide`](file:///C:/Users/Sri/.gemini/antigravity-ide/builtin/skills/antigravity_guide)
- **Purpose:** Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY), including the Antigravity CLI (agy), Antigravity 2.0, Antigravity IDE, Python SDK, slash commands, keybindings, and customizations (skills, rules, MCP, sidecars). Activate this skill when the user asks questions about how to use, configure, or customize Antigravity, AGY, the agy CLI, the Antigravity IDE, or Antigravity 2.0.
- **Included Subfolders:** `references/` (4 items: app.md, cli.md, ide.md, sdk.md)

### 10. `awesome-mcp-curator`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\awesome-mcp-curator`](file:///C:/Users/Sri/.gemini/config/skills/awesome-mcp-curator)
- **Purpose:** Discover, configure, and develop Model Context Protocol (MCP) servers and tool integrations. Covers standard MCP protocol specifications, STDIO & SSE transports, tool schemas, resource providers, and integration with databases, browsers, and external APIs.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 11. `bigquery-ai-ml`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\bigquery_ai_ml`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/bigquery_ai_ml)
- **Purpose:** >- Leverages BigQuery's built-in machine learning and GenAI capabilities for advanced data analytics. Use when you need to write SQL queries that perform time-series forecasting, detect outliers, find key drivers, or leverage generative AI capabilities in BigQuery.
- **Included Subfolders:** `references/` (17 items: ai_agg.md, ai_classify.md, ai_detect_anomalies.md, ai_evaluate.md, ... (+13 more))

### 12. `bigquery-bigframes`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\bigquery_bigframes`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/bigquery_bigframes)
- **Purpose:** >- Generates Python code using BigQuery DataFrames (BigFrames), the pandas/scikit-learn-style API over BigQuery. Use when writing BigFrames code or doing pandas-style dataframe/ML work against BigQuery (e.g. in a notebook). Don't use for SQL-first workflows or the google-cloud-bigquery client library — use bigquery-basics.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 13. `bigquery-data-transfer-service`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\bigquery-data-transfer-service`](file:///C:/Users/Sri/.gemini/config/skills/bigquery-data-transfer-service)
- **Purpose:** Discovers and inspects BigQuery Data Transfer Service (DTS) configurations. Use this to identify existing ingestion pipelines and extract datasource or transfer config metadata for data pipelines. Use when a user asks for ingestion scenarios while building or managing data pipelines or when a user asks to "ingest" or "add" data that may already be managed by a DTS transfer.
- **Included Subfolders:** `scripts/` (1 items: bigquery_dts.py)

### 14. `bigquery-data-transfer-service`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\bigquery_data_transfer_service`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/bigquery_data_transfer_service)
- **Purpose:** Discovers and inspects BigQuery Data Transfer Service (DTS) configurations. Use this to identify existing ingestion pipelines and extract datasource or transfer config metadata for data pipelines. Use when a user asks for ingestion scenarios while building or managing data pipelines or when a user asks to "ingest" or "add" data that may already be managed by a DTS transfer.
- **Included Subfolders:** `scripts/` (1 items: bigquery_dts.py)

### 15. `bigquery-graph`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\bigquery_graph`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/bigquery_graph)
- **Purpose:** >- Provides guidelines and best practices for querying and defining property graphs and semantic graphs in BigQuery using GQL (Graph Query Language). Use when creating property graphs or querying graph topologies in BigQuery.
- **Included Subfolders:** `references/` (3 items: graph-schema, graph_queries.md, semantic_queries.md)

### 16. `bigquery-sql`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\bigquery-sql`](file:///C:/Users/Sri/.gemini/config/skills/bigquery-sql)
- **Purpose:** Provides BigQuery SQL query optimization techniques, execution best practices, and performance tuning rules for high-efficiency querying. Use when optimizing BigQuery SQL queries, reducing query costs, or designing performant SQL transformations.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 17. `bigquery-sql`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\bigquery_sql`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/bigquery_sql)
- **Purpose:** >- Provides BigQuery SQL query optimization techniques, execution best practices, and performance tuning rules for high-efficiency querying. Use when optimizing BigQuery SQL queries, reducing query costs, or designing performant SQL transformations.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 18. `bigtable-basics`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\bigtable_basics`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/bigtable_basics)
- **Purpose:** >- Assists in provisioning instances/tables, designing performant schemas, and querying data in Bigtable. Use when designing Bigtable row keys, configuring column families, writing SQL queries or client library code (Java, Go, Python) for Bigtable, or diagnosing performance/hotspotting issues. Also use when provisioning Bigtable clusters using gcloud or cbt CLIs. Don't use for generic Cloud SQL administration.
- **Included Subfolders:** `references/` (6 items: client_libraries.md, cli_data_access.md, dataplex.md, infrastructure_management.md, ... (+2 more))

### 19. `book-to-skill`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\book-to-skill`](file:///C:/Users/Sri/.gemini/config/skills/book-to-skill)
- **Purpose:** Convert technical documentation, books, PDF manuals, API references, and open-source repositories into structured, high-density AI agent skills (SKILL.md) optimized for tool-use and code generation.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 20. `building-data-apps`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\building-data-apps`](file:///C:/Users/Sri/.gemini/config/skills/building-data-apps)
- **Purpose:** Build modern data apps, dashboards, and interactive reports using either React + Vite or Streamlit. Includes optional Gemini Data Analytics chat integration for an AI powered "chat with your data" experience. Relevant when any of the following conditions are true: 1. User explicitly requests to build a data dashboard, data application, or visualization UI, and the UI pulls data from a GCP database (defaulting to BigQuery unless otherwise specified). 2. You need to generate a frontend web application to interact with, query, and visualize data from GCP data sources. 3. User wants to build a "chat with your data" experience or integrate the Gemini Data Analytics chat API into a web interface. Do NOT use when any of the following conditions are true: 1. The request is for building backend-only services. 2. The request is for simple CLI scripts or command-line applications. 3. The web application is not data-centric or does not involve visualizing/querying data from GCP sources.
- **Included Subfolders:** `references/` (4 items: chat_integration.md, react_framework.md, shared_design_system.md, streamlit_framework.md); `examples/` (3 items: express_chat.ts, fastapi_chat.py, react_chat_panel.jsx)

### 21. `building-data-apps`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\building_data_apps`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/building_data_apps)
- **Purpose:** Build modern data apps, dashboards, and interactive reports using either React + Vite or Streamlit. Includes optional Gemini Data Analytics chat integration for an AI powered "chat with your data" experience. Relevant when any of the following conditions are true: 1. User explicitly requests to build a data dashboard, data application, or visualization UI, and the UI pulls data from a GCP database (defaulting to BigQuery unless otherwise specified). 2. You need to generate a frontend web application to interact with, query, and visualize data from GCP data sources. 3. User wants to build a "chat with your data" experience or integrate the Gemini Data Analytics chat API into a web interface. Do NOT use when any of the following conditions are true: 1. The request is for building backend-only services. 2. The request is for simple CLI scripts or command-line applications. 3. The web application is not data-centric or does not involve visualizing/querying data from GCP sources.
- **Included Subfolders:** `references/` (4 items: chat_integration.md, react_framework.md, shared_design_system.md, streamlit_framework.md); `examples/` (3 items: express_chat.ts, fastapi_chat.py, react_chat_panel.jsx)

### 22. `chembl-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\chembl_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/chembl_database)
- **Purpose:** > Query the ChEMBL database for bioactive molecules, drug targets, bioactivity data, approved drugs, and chemical structures. Use when the user asks about compounds, targets, IC50/Ki values, drug mechanisms, or structure searches.
- **Included Subfolders:** `scripts/` (1 items: chembl_api.py); `references/` (2 items: api_endpoints.md, citation.bib)

### 23. `clinical-trials-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\clinical_trials_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/clinical_trials_database)
- **Purpose:** > Query ClinicalTrials.gov via APIv2. Use when you want to search for trials by condition, drug, location, status, or phase; retrieve trial details by NCT ID; check eligibility/inclusion criteria; count trials across conditions or time periods; identify a sponsor's trial portfolio; find recruiting trials for patient matching.
- **Included Subfolders:** `scripts/` (1 items: clinical_trials_api.py); `references/` (3 items: citation.bib, clinical_trials_api.md, studies_schema.md)

### 24. `clinvar-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\clinvar_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/clinvar_database)
- **Purpose:** > Use when needing clinical significance, pathogenicity classifications (e.g., Pathogenic, Benign, VUS), clinical evidence rationales, or finding "hard positive" benchmark controls for human genomic variants.
- **Included Subfolders:** `scripts/` (1 items: clinvar_api.py); `references/` (1 items: citation.bib)

### 25. `credentials`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\credentials`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/credentials)
- **Purpose:** >- Instructions for handling API keys and credentials safely, verifying their presence, and prompting the user to add them if missing using a safe protocol.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 26. `data-autocleaning`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\data-autocleaning`](file:///C:/Users/Sri/.gemini/config/skills/data-autocleaning)
- **Purpose:** Automated data quality and transformation capabilities for Dataform/dbt/BigQuery pipelines. Processes data sourced from BigQuery or Cloud Storage (GCS), applying best practices for data ingestion, movement, schema mapping, and comprehensive data cleaning.
- **Included Subfolders:** `scripts/` (1 items: dataplex_scanner.py)

### 27. `data-autocleaning`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\data_autocleaning`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/data_autocleaning)
- **Purpose:** Automated data quality and transformation capabilities for Dataform/dbt/BigQuery pipelines. Processes data sourced from BigQuery or Cloud Storage (GCS), applying best practices for data ingestion, movement, schema mapping, and comprehensive data cleaning.
- **Included Subfolders:** `scripts/` (1 items: dataplex_scanner.py)

### 28. `dataform-bigquery`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\dataform-bigquery`](file:///C:/Users/Sri/.gemini/config/skills/dataform-bigquery)
- **Purpose:** Expertise in generating clean, correct, and efficient Dataform pipeline code for BigQuery ELT. Use this when creating or modifying Dataform pipelines, actions, or source declarations, when Dataform, SQLX, or BigQuery are mentioned in a transformation, when data needs to be ingested from GCS into BigQuery via Dataform, or when setting up a new Dataform project or configuring workflow_settings.yaml.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 29. `dataform-bigquery`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\dataform_bigquery`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/dataform_bigquery)
- **Purpose:** Expertise in generating clean, correct, and efficient Dataform pipeline code for BigQuery ELT. Use this when creating or modifying Dataform pipelines, actions, or source declarations, when Dataform, SQLX, or BigQuery are mentioned in a transformation, when data needs to be ingested from GCS into BigQuery via Dataform, or when setting up a new Dataform project or configuring workflow_settings.yaml.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 30. `dbsnp-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\dbsnp_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/dbsnp_database)
- **Purpose:** > Use when you want to look up, map, and search for short genetic variants (SNPs, indels) in NCBI's dbSNP database. Resolves between rsIDs, genomic coordinates in VCF format, and HGVS strings. For an rsID, returns variant type, gene associations, clinical significance, allele frequencies, and genomic coordinates (GRCh38).
- **Included Subfolders:** `scripts/` (1 items: dbsnp_cli.py); `references/` (2 items: api-notes.md, citation.bib)

### 31. `dbt-bigquery`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\dbt-bigquery`](file:///C:/Users/Sri/.gemini/config/skills/dbt-bigquery)
- **Purpose:** Expert guidance for creating, modifying, and optimizing dbt pipelines for BigQuery. Use this skill whenever user asks for generating or modifying a dbt model or project. Activate this skill when the user - Creates, modifies, or troubleshoots **dbt models or pipelines** - Needs to **optimize SQL** within a dbt project - Is **setting up a new dbt project** or configuring existing one
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 32. `dbt-bigquery`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\dbt_bigquery`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/dbt_bigquery)
- **Purpose:** Expert guidance for creating, modifying, and optimizing dbt pipelines for BigQuery. Use this skill whenever user asks for generating or modifying a dbt model or project. Activate this skill when the user - Creates, modifies, or troubleshoots **dbt models or pipelines** - Needs to **optimize SQL** within a dbt project - Is **setting up a new dbt project** or configuring existing one
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 33. `discovering-gcp-data-assets`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\discovering-gcp-data-assets`](file:///C:/Users/Sri/.gemini/config/skills/discovering-gcp-data-assets)
- **Purpose:** Finds and inspects data assets within Google Cloud. Relevant when any of the following conditions are true: 1. The user request involves finding, exploring, or inspecting data assets in Google Cloud, such as: - BigQuery datasets, tables, or views - BigLake catalog or tables - Spanner instances, databases or tables - etc. 2. You need to retrieve the schema, metadata, or governance policies for a GCP data asset. 3. You have a keyword or topic (e.g., "sales data") but lack the specific table or resource ID. 4. You are attempting to find data using `bq ls`, as this skill offers a superior approach. Don't use when: - Assets are outside Google Cloud
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 34. `discovering-gcp-data-assets`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\discovering_gcp_data_assets`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/discovering_gcp_data_assets)
- **Purpose:** Finds and inspects data assets within Google Cloud. Relevant when any of the following conditions are true: 1. The user request involves finding, exploring, or inspecting data assets in Google Cloud, such as: - BigQuery datasets, tables, or views - BigLake catalog or tables - Spanner instances, databases or tables - etc. 2. You need to retrieve the schema, metadata, or governance policies for a GCP data asset. 3. You have a keyword or topic (e.g., "sales data") but lack the specific table or resource ID. 4. You are attempting to find data using `bq ls`, as this skill offers a superior approach. Don't use when: - Assets are outside Google Cloud
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 35. `embl-ebi-ols`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\embl_ebi_ols`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/embl_ebi_ols)
- **Purpose:** > Query and search the EMBL-EBI Ontology Lookup Service (OLS) for biomedical ontology terms, definitions, and hierarchies across 250+ ontologies (e.g., GO, DOID, HP). Use when the user asks to search for terms, retrieve details, navigate hierarchies (parents, children, ancestors), look up properties and individuals, get autocomplete suggestions, or access ontology metadata and statistics.
- **Included Subfolders:** `scripts/` (8 items: get_individual.py, get_ontology.py, get_property.py, get_stats.py, ... (+4 more)); `references/` (2 items: api_reference.md, citation.bib)

### 36. `encode-ccres-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\encode_ccres_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/encode_ccres_database)
- **Purpose:** > Query the ENCODE Registry of cis-Regulatory Elements (cCREs) via the SCREEN GraphQL API, or make custom queries to the ENCODE Portal REST API for experiments and files (ChIP-seq peaks, etc.). Use when you want to query regulatory annotations or raw experimental data across human cell types.
- **Included Subfolders:** `scripts/` (2 items: encode_portal_api.py, screen_api.py); `references/` (3 items: citation.bib, graphql_schema.md, json_output_structure.md)

### 37. `enforcing-resource-attribution`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\enforcing-resource-attribution`](file:///C:/Users/Sri/.gemini/config/skills/enforcing-resource-attribution)
- **Purpose:** 'Enforces resource attribution for CLI commands. Use this skill whenever you are running `bq` or `gcloud` commands via `run_command`. It ensures mandatory labeling for supported `bq` operations while avoiding invalid flags on read-only commands. '
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 38. `enforcing-resource-attribution`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\enforcing_resource_attribution`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/enforcing_resource_attribution)
- **Purpose:** Enforces resource attribution for CLI commands. Use this skill whenever you are running `bq` or `gcloud` commands via `run_command`. It ensures mandatory labeling for supported `bq` operations while avoiding invalid flags on read-only commands.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 39. `ensembl-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\ensembl_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/ensembl_database)
- **Purpose:** > Query the Ensembl database to resolve gene, transcript, and protein IDs, fetch genomic or protein sequences, retrieve gene structures (exons), and get variant consequence and effect predictions (VEP). Use this skill as a primary ID translator, genomic sequence database and variant effect prediction tool.
- **Included Subfolders:** `scripts/` (1 items: ensembl_api.py); `references/` (2 items: citation.bib, ensembl_rest_api_reference.md)

### 40. `federate-lakehouse-catalog`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\federate_lakehouse_catalog`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/federate_lakehouse_catalog)
- **Purpose:** >- Sets up Google Cloud Lakehouse federated catalogs to remote Iceberg REST Catalogs. Currently supported catalogs: Databricks Unity, AWS Glue. Supported clouds hosting those catalogs: GCP, AWS. The primary use case is connecting to remote data to query it from GCP engines (BigQuery, Spark). Examples of when to use this: "federate my lakehouse catalog to databricks", "query data in databricks", "query data in s3", "connect to aws glue". Do NOT use for direct remote database SQL execution (e.g., Databricks SQL) or managing remote clusters and infrastructure (e.g., Databricks clusters, AWS Glue jobs).
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 41. `foldseek-structural-search`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\foldseek_structural_search`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/foldseek_structural_search)
- **Purpose:** > Performs 3D structural searches of proteins against various databases (PDB, AlphaFold, CATH, MGnify, etc.) using the Foldseek API. Use ONLY when the user provides a physical 3D coordinate file (.cif, .mmcif, or .pdb) and wants to find structurally similar proteins. Do NOT use if the user only provides a protein sequence, gene name, or UniProt ID.
- **Included Subfolders:** `scripts/` (1 items: search.py); `references/` (1 items: citation.bib)

### 42. `gcp-composer-troubleshooting`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_composer_troubleshooting`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_composer_troubleshooting)
- **Purpose:** 'Provides expert guidance for troubleshooting Cloud Composer (Apache Airflow) and Orchestration pipelines. Use this skill when the user asks to generate Root Cause Analysis (RCA), troubleshoot or fix a failed pipeline, DAG in Composer environment and generate RCA report. '
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 43. `gcp-data-pipelines`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\gcp-data-pipelines`](file:///C:/Users/Sri/.gemini/config/skills/gcp-data-pipelines)
- **Purpose:** 'Primary entry point for building, managing, and orchestrating data pipelines on Google Cloud. Guides users to the appropriate skill for dbt, Dataflow (Apache Beam), Dataform, Spark (Dataproc Serverless), BigQuery Data Transfer Service (DTS) or orchestration pipeline using Cloud Composer. Clarify requirements and resolve ambiguity for creating, updating and running data pipelines. '
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 44. `gcp-data-pipelines`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_data_pipelines`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_data_pipelines)
- **Purpose:** 'Primary entry point for building, managing, and orchestrating data pipelines on Google Cloud. Guides users to the appropriate skill for dbt, Dataflow (Apache Beam), Dataform, Spark (Dataproc Serverless), BigQuery Data Transfer Service (DTS) or orchestration pipeline using Cloud Composer. Clarify requirements and resolve ambiguity for creating, updating and running data pipelines. '
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 45. `gcp-dataflow`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\gcp-dataflow`](file:///C:/Users/Sri/.gemini/config/skills/gcp-dataflow)
- **Purpose:** Guides writing, packaging, executing, and troubleshooting Apache Beam pipelines on Dataflow. Use when creating new pipelines, configuring Flex Templates, or analyzing performance of Dataflow jobs. Capabilities include Java/Python/Go setup, Cloud Build integration, and deep diagnostic analysis of job health and autoscaling. Use when: - Creating an Apache Beam Dataflow pipeline. - Creating a Google Dataflow Flex Template. - Using an existing Google Dataflow Template. - Debugging Dataflow pipeline - Troubleshooting Dataflow pipeline - Analyzing Performance of Dataflow pipeline. Key capabilities: Java/Python/Go project setup, Flex Templates (with Cloud Build), and diagnostics for streaming job health, bottlenecks, and autoscaling. Do NOT use for: - General GCP resource management unrelated to Dataflow. - Issues with other GCP services (e.g., GCE, GCS, BigQuery) unless directly impacting Dataflow pipeline execution. - Pipeline technologies other than Apache Beam on Dataflow.
- **Included Subfolders:** `references/` (10 items: bottlenecks_and_parallelism_context.md, dataflow_diagnostics_reference.md, dataflow_metrics_bigquery.md, dataflow_metrics_core_job.md, ... (+6 more))

### 46. `gcp-dataflow`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_dataflow`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_dataflow)
- **Purpose:** > Guides writing, packaging, executing, and troubleshooting Apache Beam pipelines on Dataflow. Use when creating new pipelines, configuring Flex Templates, or analyzing performance of Dataflow jobs. Capabilities include Java/Python/Go setup, Cloud Build integration, and deep diagnostic analysis of job health and autoscaling. Use when: - Creating an Apache Beam Dataflow pipeline. - Creating a Google Dataflow Flex Template. - Using an existing Google Dataflow Template. - Debugging Dataflow pipeline - Troubleshooting Dataflow pipeline - Analyzing Performance of Dataflow pipeline. Key capabilities: Java/Python/Go project setup, Flex Templates (with Cloud Build), and diagnostics for streaming job health, bottlenecks, and autoscaling. Do NOT use for: - General GCP resource management unrelated to Dataflow. - Issues with other GCP services (e.g., GCE, GCS, BigQuery) unless directly impacting Dataflow pipeline execution. - Pipeline technologies other than Apache Beam on Dataflow.
- **Included Subfolders:** `references/` (9 items: bottlenecks_and_parallelism_context.md, dataflow_diagnostics_reference.md, dataflow_metrics_bigquery.md, dataflow_metrics_core_job.md, ... (+5 more))

### 47. `gcp-managed-airflow-dag-authoring`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_managed_airflow_dag_authoring`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_managed_airflow_dag_authoring)
- **Purpose:** Guides the authoring and validation of Apache Airflow DAGs for Managed Service for Apache Airflow (MSAA; formerly Cloud Composer). Covers environment context discovery, Airflow 2 vs 3 compatibility, authoring best practices, and local/remote validation processes. Use when creating or extending an Airflow DAG. Don't use when authoring Python code unrelated to Airflow DAGs.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 48. `gcp-managed-airflow-migrations`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_managed_airflow_migrations`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_managed_airflow_migrations)
- **Purpose:** Provides guidance for migrating Apache Airflow DAGs in Managed Service for Apache Airflow (MSAA; formerly Cloud Composer). Covers migration to Airflow 2.11.1 (MSAA Gen 2 and 3) and Airflow 3 (MSAA Gen 3), including environment inspection, GCS download/upload and scanning patterns for breaking changes.
- **Included Subfolders:** `references/` (3 items: airflow-3.md, environment-inspection.md, local-development-environment.md)

### 49. `gcp-managed-airflow-recommendations`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_managed_airflow_recommendations`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_managed_airflow_recommendations)
- **Purpose:** 'Provides recommendations and best practices for creating, configuring, tuning and optimizing Managed Service for Apache Airflow (MSAA, Cloud Composer) environments. Use when the user asks for guidance, recommendations, or best practices on configuring Cloud Composer, scaling Airflow environments, preventing workload restarts, or analyzing system health.'
- **Included Subfolders:** `scripts/` (7 items: dag_parsing_stats.py, environment_health.py, lib, workload_cpu_usage.py, ... (+3 more)); `references/` (1 items: gcloud_reference.md)

### 50. `gcp-pipeline-orchestration`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\gcp-pipeline-orchestration`](file:///C:/Users/Sri/.gemini/config/skills/gcp-pipeline-orchestration)
- **Purpose:** This skill helps the agent generate or update orchestration pipeline definitions for Google Cloud Composer to initialize orchestration pipeline or update the orchestration definition for orchestration of various data pipelines, like dbt pipelines, notebooks, Spark jobs, Dataform, Python scripts or inline BigQuery SQL queries. This skill also helps deploy and trigger orchestration pipelines.
- **Included Subfolders:** `scripts/` (1 items: trigger); `references/` (1 items: orchestration-pipelines-schema.md)

### 51. `gcp-pipeline-orchestration`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_pipeline_orchestration`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_pipeline_orchestration)
- **Purpose:** This skill helps the agent generate or update orchestration pipeline definitions for Google Cloud Composer to initialize orchestration pipeline or update the orchestration definition for orchestration of various data pipelines, like dbt pipelines, notebooks, Spark jobs, Dataform, Python scripts or inline BigQuery SQL queries. This skill also helps deploy and trigger orchestration pipelines.
- **Included Subfolders:** `scripts/` (1 items: trigger); `references/` (1 items: orchestration-pipelines-schema.md)

### 52. `gcp-pipeline-resource-provisioning`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\gcp-pipeline-resource-provisioning`](file:///C:/Users/Sri/.gemini/config/skills/gcp-pipeline-resource-provisioning)
- **Purpose:** Automates declarative resource creation and provisioning for data pipelines, supporting BigQuery, Dataform, Dataproc, BigQuery Data Transfer Service (DTS), and other resources. It manages environment-specific configurations (dev, staging, prod) through a deployment.yaml file. Use when: - Modifying or creating deployment.yaml for deployment settings. - Resolving environment-specific variables (e.g., Project IDs, Regions) for deployment. - Provisioning supported infrastructure like BigQuery datasets/tables, Dataform resources, or DTS resources via deployment.yaml. Do not use when: - Resources already exist. - Managing resources not supported by `gcloud beta orchestration-pipelines resource-types list`. - Managing general cloud infrastructure (VMs, networks, Kubernetes, IAM policies), which are better suited for Terraform. - Infrastructure spans multiple cloud providers (AWS, Azure, etc.). - Already uses Terraform for the target resources.
- **Included Subfolders:** `references/` (1 items: gcp_pipeline_resource_provisioning_spec.md)

### 53. `gcp-pipeline-resource-provisioning`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_pipeline_resource_provisioning`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_pipeline_resource_provisioning)
- **Purpose:** Automates declarative resource creation and provisioning for data pipelines, supporting BigQuery, Dataform, Dataproc, BigQuery Data Transfer Service (DTS), and other resources. It manages environment-specific configurations (dev, staging, prod) through a deployment.yaml file. Use when: - Modifying or creating deployment.yaml for deployment settings. - Resolving environment-specific variables (e.g., Project IDs, Regions) for deployment. - Provisioning supported infrastructure like BigQuery datasets/tables, Dataform resources, or DTS resources via deployment.yaml. Do not use when: - Resources already exist. - Managing resources not supported by `gcloud beta orchestration-pipelines resource-types list`. - Managing general cloud infrastructure (VMs, networks, Kubernetes, IAM policies), which are better suited for Terraform. - Infrastructure spans multiple cloud providers (AWS, Azure, etc.). - Already uses Terraform for the target resources.
- **Included Subfolders:** `references/` (1 items: gcp_pipeline_resource_provisioning_spec.md)

### 54. `gcp-spark`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\gcp-spark`](file:///C:/Users/Sri/.gemini/config/skills/gcp-spark)
- **Purpose:** Develops, optimizes and executes Spark code on Managed Spark on Google Cloud (Dataproc Clusters and Serverless). Reads and writes data using BigLake Iceberg catalogs, BigQuery and Spanner. Debugs execution failures. Use when: - Writing Spark ETL pipelines on Google Cloud Platform. - Optimizing PySpark or Spark SQL code for performance, memory, or OOM risks. - Preparing Spark workloads for production submission. - Training or running inference with Machine Learning models with spark on Google Cloud Platform. - Managing Spark clusters, jobs, batches, and interactive sessions. Don't use when: - Writing generic Python scripts that don't use Spark. - Performing simple SQL queries that can be done directly in BigQuery. - Troubleshooting failed Spark workloads or analyzing logs (use @skill:gcp-spark-troubleshooting).
- **Included Subfolders:** `references/` (6 items: gcloud_dataproc.md, ml_tasks.md, read_write_data.md, schema_direct_inspection.md, ... (+2 more))

### 55. `gcp-spark`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcp_spark`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcp_spark)
- **Purpose:** Develops and executes Spark code on Managed Spark on Google Cloud (Dataproc Clusters and Serverless). Reads and writes data using BigLake Iceberg catalogs, BigQuery and Spanner. Debugs execution failures. Use when: - Writing Spark ETL pipelines on Google Cloud Platform. - Training or running inference with Machine Learning models with spark on Google Cloud Platform. - Managing Spark clusters, jobs, batches, and interactive sessions. Don't use when: - Writing generic Python scripts that don't use Spark. - Performing simple SQL queries that can be done directly in BigQuery.
- **Included Subfolders:** `references/` (5 items: gcloud_dataproc.md, ml_tasks.md, read_write_data.md, schema_direct_inspection.md, ... (+1 more))

### 56. `gcp-spark-troubleshooting`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\gcp-spark-troubleshooting`](file:///C:/Users/Sri/.gemini/config/skills/gcp-spark-troubleshooting)
- **Purpose:** Provides expert guidance for troubleshooting Google Cloud Spark and Dataproc workloads (Dataproc Serverless batches and standard Dataproc clusters), and inspecting, streaming, searching, tailing, or summarizing Spark driver outputs and event logs in Cloud Storage. Use when the user asks to debug, troubleshoot, diagnose, or perform Root Cause Analysis (RCA) on failed Spark jobs, PySpark batches, or Spark event logs.
- **Included Subfolders:** `scripts/` (3 items: spark_code_inspector.py, spark_gcs_log_reader.py, spark_stage_diagnostics.py); `references/` (4 items: diagnostic_rules_catalog.md, gcs_event_log_guide.md, rca_report_template.md, spark_log_patterns.md)

### 57. `gcs-security-assessment`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\gcs_security_assessment`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/gcs_security_assessment)
- **Purpose:** >- Assesses the security posture of Google Cloud Storage (GCS) buckets and projects. Grounds every finding in gathered telemetry, evaluates buckets against Google security best practices (public access, IAM over-granting, CMEK, VPC Service Controls, audit logging), and correlates signals to flag toxic combinations of individually low-risk settings, with actionable remediation. Use whenever a user asks for a security scan, audit, review, vulnerability check, or compliance assessment (including SAIF) — or simply asks whether their buckets, project, or data are secure, exposed, public, or misconfigured, who can access their data, or wants storage hardened or locked down, e.g. before a launch. Don't use for diagnosing a specific access failure or 403, managing or configuring storage, investigating a live outage, or non-GCS resources (Compute Engine, GKE, etc.).
- **Included Subfolders:** `scripts/` (7 items: cloud_rest_helpers_nodeps.py, evaluate_project_security_posture.py, fetch_bucket_telemetry.py, fetch_object_telemetry.py, ... (+3 more)); `references/` (6 items: baseline_security.md, bucket_classification.md, phases, saif_risk_factors.md, ... (+2 more)); `examples/` (1 items: sample_assessment.md)

### 58. `gemini-api-dev`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\gemini-api\skills\gemini-api-dev`](file:///C:/Users/Sri/.gemini/config/plugins/gemini-api/skills/gemini-api-dev)
- **Purpose:** Use this skill when writing code that calls the Gemini API for text generation, multi-turn chat, multimodal understanding, image generation, video generation, streaming responses, background research tasks, function calling, structured output, or migrating from the old generateContent API. Covers SDK usage and best practices for Gemini models and agents in Python and TypeScript.
- **Included Subfolders:** `references/` (1 items: migration.md)

### 59. `gemini-live-api-dev`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\gemini-api\skills\gemini-live-api-dev`](file:///C:/Users/Sri/.gemini/config/plugins/gemini-api/skills/gemini-live-api-dev)
- **Purpose:** Use this skill when building real-time, bidirectional streaming applications with the Gemini Live API. Covers WebSocket-based audio/video/text streaming, voice activity detection (VAD), native audio features, function calling, session management, ephemeral tokens for client-side auth, live translation, and all Live API configuration options. SDKs covered - google-genai (Python), @google/genai (JavaScript/TypeScript).
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 60. `gemini-omni-flash-api`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\gemini-api\skills\gemini-omni-flash-api`](file:///C:/Users/Sri/.gemini/config/plugins/gemini-api/skills/gemini-omni-flash-api)
- **Purpose:** Use this skill for generative video editing, text-to-video, image-referenced video generation, first-frame-to-video, first-and-last-frame transitions, and video extensions using Gemini Omni 1.1 Flash (gemini-omni-1.1-flash) via the official google-genai SDK. Includes workflows for pre-processing/optimizing high-resolution or long source videos with ffmpeg, stripping audio for full sound regeneration, and handling turn-by-turn video editing and parallel execution.
- **Included Subfolders:** `scripts/` (2 items: upload_file.py, video)

### 61. `gnomad-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\gnomad_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/gnomad_database)
- **Purpose:** > Query the Genome Aggregation Database (gnomAD). Use when determining the rarity or allele frequency of specific genetic variants, retrieving gene constraint metrics (pLI, LOEUF) to assess loss-of-function intolerance, finding variants in a genomic region or gene, or querying structural variants. Don't use for analyzing individual patient genomes, tracking somatic mutations in cancer (use COSMIC), or requesting raw sequencing reads (use ENA).
- **Included Subfolders:** `scripts/` (3 items: get_gene_constraint.py, get_variant_frequency.py, search_variants.py); `references/` (1 items: citation.bib)

### 62. `google-cloud-auth-verification`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\google-cloud-auth-verification`](file:///C:/Users/Sri/.gemini/config/skills/google-cloud-auth-verification)
- **Purpose:** Mandatory Step 0 pre-flight execution order and authentication verification for Google Cloud Platform (GCP), Application Default Credentials (ADC), gcloud CLI, Spark, Dataproc, BigQuery, GCS, and notebook runtimes. Use whenever interacting with GCP resources, running Spark/PySpark pipelines, BigQuery queries, GCS paths (gs://), or creating/running notebooks.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 63. `google-cloud-auth-verification`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\google_cloud_auth_verification`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/google_cloud_auth_verification)
- **Purpose:** >- Mandatory Step 0 pre-flight execution order and authentication verification for Google Cloud Platform (GCP), Application Default Credentials (ADC), gcloud CLI, Spark, Dataproc, BigQuery, GCS, and notebook runtimes. Use whenever interacting with GCP resources, running Spark/PySpark pipelines, BigQuery queries, GCS paths (gs://), or creating/running notebooks.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 64. `google-cloud-storage-basics`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\google_cloud_storage_basics`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/google_cloud_storage_basics)
- **Purpose:** >- Stores, retrieves, and manages data as objects in Cloud Storage (Google Cloud Storage, or GCS) buckets. Use when you need to interact with Cloud Storage — create or configure buckets, upload, download, stream, or transfer data, organize objects with folders, generate signed URLs, control access (IAM, ACLs, public access prevention), set storage classes and tiering (Standard, Nearline, Coldline, Archive), manage cost and lifecycle, protect data (versioning, encryption/CMEK, retention and Bucket Lock, object holds, soft delete), host static websites, trigger Pub/Sub notifications on object changes, mount buckets as a file system (gcsfuse), or optimize storage performance at any scale. Covers the gcloud storage / gsutil CLI, JSON and XML APIs, client libraries, Terraform, and Cloud Storage MCP servers. Don't use for block storage (Persistent Disk), data warehousing/analytics (BigQuery), or databases (Cloud SQL, Spanner, Bigtable, Firestore).
- **Included Subfolders:** `references/` (10 items: cli-api-usage.md, client-library-usage.md, core-concepts.md, data-management.md, ... (+6 more))

### 65. `google-cloud-storage-bucket-architect`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\google_cloud_storage_bucket_architect`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/google_cloud_storage_bucket_architect)
- **Purpose:** >- Creates Cloud Storage (Google Cloud Storage, or GCS) buckets. Analyzes the workload (sensitive data, media hosting, ingestion, web hosting, archiving, backup, logging, analytics, AI/ML, or general-purpose), validates project-level security settings, and designs a secure-by-default, cost-effective configuration (location, storage class, uniform bucket-level access, public access prevention, soft delete, lifecycle) before creating it. Use whenever a user wants to create, make, set up, provision, or spin up a bucket, or needs object storage for an app, service, pipeline, or dataset — even a "simple" or "default" bucket, or when bucket creation is one step in a larger workflow. Outputs or executes the creation via gcloud, the JSON/REST API, Terraform, or SDK client libraries (C++, Java, Python, Go). Don't use for anything other than creating new buckets — for uploads, downloads, access changes, or reconfiguring existing buckets, use google-cloud-storage-basics.
- **Included Subfolders:** `references/` (19 items: archiving_compliance.md, backup_dr.md, gcloud.md, log_storage.md, ... (+15 more))

### 66. `google-cloud-storage-fuse`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\google_cloud_storage_fuse`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/google_cloud_storage_fuse)
- **Purpose:** >- Mounts Cloud Storage buckets as a POSIX file system with Cloud Storage FUSE (gcsfuse). Use when you need to interact with gcsfuse — decide whether FUSE, native gs:// reads, or Filestore/Managed Lustre fits a workload, deploy tuned mounts on GKE, Compute Engine, or Cloud Run, enable and size the file, stat, and list caches, tune mount flags or config-file settings, apply workload profiles, keep ML checkpointing safe (rename atomicity, hierarchical namespace, close-time finalization, concurrent writers), or diagnose slow training, low throughput, or GCS bill spikes on existing mounts with gcsfuse metrics. Covers mount semantics, the gcsfuse CLI and config file, the GKE gcsfuse CSI driver (Workload Identity principal:// bindings, profile StorageClasses, sidecar sizing), and Cloud Run volume mounts. Don't use for bucket administration or data management without a mount (google-cloud-storage-basics) or for fully POSIX-compliant shared file systems (Filestore, Managed Lustre).
- **Included Subfolders:** `references/` (3 items: checkpoint-safety.md, gke-training-deployment.md, performance-diagnosis.md)

### 67. `gtex-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\gtex_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/gtex_database)
- **Purpose:** > Use when you want to retrieve quantitative RNA expression data and variant eQTL information from the GTEx (Genotype-Tissue Expression) Project across 54 non-diseased tissue sites.
- **Included Subfolders:** `scripts/` (1 items: gtex_cli.py); `references/` (1 items: citation.bib)

### 68. `human-protein-atlas-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\human_protein_atlas_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/human_protein_atlas_database)
- **Purpose:** > Use when you want to retrieve semi-quantitative protein expression and spatial localisation data from the Human Protein Atlas (HPA).
- **Included Subfolders:** `scripts/` (1 items: hpa_cli.py); `references/` (2 items: citation.bib, search-api.md)

### 69. `interpro-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\interpro_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/interpro_database)
- **Purpose:** > Identify domains, families, and sites in proteins; find all proteins in a family or sharing a domain; explore species distribution for a domain; annotate genomes with protein families and GO terms. InterPro combines 14 databases (e.g., Pfam, CDD) into one searchable resource. InterPro-N significantly expands annotation and sequence coverage with deep learning. Includes domain architecture (IDA) search.
- **Included Subfolders:** `scripts/` (1 items: interpro_client.py); `references/` (3 items: api_reference.md, citation.bib, example_responses.tsv)

### 70. `jaspar-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\jaspar_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/jaspar_database)
- **Purpose:** > Query the JASPAR database for Transcription Factor (TF) binding profiles. Use when retrieving Position Frequency Matrices (PFMs) or Position Weight Matrices (PWMs) for specific TFs, resolving gene symbols to JASPAR Matrix IDs, or getting TF metadata. Supports multiple output formats (MEME, TRANSFAC, PFM, JASPAR, YAML).
- **Included Subfolders:** `scripts/` (1 items: jaspar_api.py); `references/` (1 items: citation.bib)

### 71. `literature-search-arxiv`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\literature_search_arxiv`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/literature_search_arxiv)
- **Purpose:** > Search for scientific papers, preprints, and publications on arXiv. Extract metadata, abstracts, and download full-text PDFs or HTML versions of papers. Use when the user asks to find research papers, literature, or specific arXiv IDs.
- **Included Subfolders:** `scripts/` (3 items: download_paper.py, download_paper_source.py, search_arxiv.py); `references/` (2 items: citation.bib, query_syntax.md)

### 72. `literature-search-biorxiv`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\literature_search_biorxiv`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/literature_search_biorxiv)
- **Purpose:** > Browse, filter, and download life sciences, biology, and medical preprints from bioRxiv and medRxiv. Supports fetching paper metadata by DOI, and browsing by date range with category and keyword filters. Keyword filtering is local, so date ranges MUST be narrow (1-4 weeks) with a category to prevent timeouts.
- **Included Subfolders:** `scripts/` (2 items: search_by_dates.py, search_by_doi.py); `references/` (1 items: citation.bib)

### 73. `literature-search-europepmc`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\literature_search_europepmc`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/literature_search_europepmc)
- **Purpose:** > Search Europe PMC for scientific literature and download open-access full texts and PDFs. Retrieve full-text XML/plain text by PMCID, get citation lists and bibliography.
- **Included Subfolders:** `scripts/` (1 items: europepmc_api.py); `references/` (1 items: citation.bib)

### 74. `literature-search-openalex`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\literature_search_openalex`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/literature_search_openalex)
- **Purpose:** > Query the OpenAlex scholarly database for research papers, authors, institutions, topics, sources, publishers, funders, geo-locations, and keywords. Use when searching academic papers, resolving DOIs, downloading open-access PDFs, finding an author's publications, aggregating bibliometric data (citation counts, h-index, impact factor), exploring the research taxonomies, or performing DOI lookups.
- **Included Subfolders:** `scripts/` (1 items: openalex_cli.py); `references/` (10 items: authors.md, citation.bib, geo_and_language.md, institutions.md, ... (+6 more))

### 75. `llm-app-builder`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\llm-app-builder`](file:///C:/Users/Sri/.gemini/config/skills/llm-app-builder)
- **Purpose:** Build full-stack LLM applications, visual AI pipelines, and local model inference workflows. Covers Langflow, Dify, Ollama local model hosting, Open WebUI, RAG (Retrieval-Augmented Generation), vector databases, and multi-model routing.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 76. `managing-python-dependencies`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\managing-python-dependencies`](file:///C:/Users/Sri/.gemini/config/skills/managing-python-dependencies)
- **Purpose:** Ensures proper Python dependency management, avoiding global `pip install` and adhering to project-specific tooling. Use this skill if any of the following are true: 1. Attempting to run `pip install {package_name}`. 2. Python packages or dependencies need to be added or modified. 3. Initiating a new Python project. 4. Creating a new notebook, even if just using BigQuery cells. 5. Generating Python code that includes `import` statements for third-party libraries. 6. Before executing Python scripts via the terminal to ensure the correct virtual environment is active.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 77. `managing-python-dependencies`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\managing_python_dependencies`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/managing_python_dependencies)
- **Purpose:** Ensures proper Python dependency management, avoiding global `pip install` and adhering to project-specific tooling. Use this skill if any of the following are true: 1. Attempting to run `pip install {package_name}`. 2. Python packages or dependencies need to be added or modified. 3. Initiating a new Python project. 4. Creating a new notebook, even if just using BigQuery cells. 5. Generating Python code that includes `import` statements for third-party libraries. 6. Before executing Python scripts via the terminal to ensure the correct virtual environment is active.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 78. `ml-best-practices`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\ml-best-practices`](file:///C:/Users/Sri/.gemini/config/skills/ml-best-practices)
- **Purpose:** CRITICAL RULE: You MUST use this skill whenever the task involves any machine learning tasks or data analysis. Use this skill if the user's prompt or requirements mention any of the following: * Clustering * Classification * Regression * Time series forecasting * Statistical testing * Model comparison * ML * Data analysis SQL/BigQuery ML HANDOFF: If the user requires a SQL solution, use this skill to dictate the ANALYSIS STEPS (e.g., markdown analysis cells, visualization logic), but defer to `bigquery` for all SQL syntax.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 79. `ml-best-practices`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\ml_best_practices`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/ml_best_practices)
- **Purpose:** CRITICAL RULE: You MUST use this skill whenever the task involves any machine learning tasks or data analysis. Use this skill if the user's prompt or requirements mention any of the following: * Clustering * Classification * Regression * Time series forecasting * Statistical testing * Model comparison * ML * Data analysis SQL/BigQuery ML HANDOFF: If the user requires a SQL solution, use this skill to dictate the ANALYSIS STEPS (e.g., markdown analysis cells, visualization logic), but defer to `bigquery` for all SQL syntax.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 80. `ncbi-sequence-fetch`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\ncbi_sequence_fetch`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/ncbi_sequence_fetch)
- **Purpose:** > Retrieve protein and nucleotide sequences from NCBI databases using E-utilities. Supports direct accession lookup, CDS translation, gene+organism search, locus lookup, PubMed-linked sequences, patent protein extraction, and organism+length fallback search. Use when you need to fetch biological sequences by accession, gene name, locus tag, PubMed ID, or patent number.
- **Included Subfolders:** `scripts/` (1 items: ncbi_fetch.py); `references/` (1 items: citation.bib)

### 81. `notebook-guidance`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\notebook-guidance`](file:///C:/Users/Sri/.gemini/config/skills/notebook-guidance)
- **Purpose:** - This skill guides the use of Jupyter notebooks for data analysis, exploration, and visualization, particularly with BigQuery. It outlines best practices for notebook execution and validation (supporting both cell-by-cell execution and full notebook generation depending on tool availability), library installation, and structuring notebooks for clarity. It also covers specific rules for data cleaning, plotting, and integrating with BigQuery SQL and machine learning workflows. Relevant when any of the following conditions are true: 1. The user request involves a data analysis, data exploration, data visualization, or data insights task that requires multiple steps, queries, or visualizations to answer. 2. The user explicitly requests a notebook (.ipynb). 3. You are creating, editing, or executing cells in a Jupyter notebook. 4. You need to query BigQuery from within a notebook. DO NOT use the Python BigQuery client library; instead, you MUST use the `%%bqsql` magics explained in this skill.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 82. `notebook-guidance`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\notebook_guidance`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/notebook_guidance)
- **Purpose:** - This skill guides the use of Jupyter notebooks for data analysis, exploration, and visualization, particularly with BigQuery. It outlines best practices for notebook execution and validation (supporting both cell-by-cell execution and full notebook generation depending on tool availability), library installation, and structuring notebooks for clarity. It also covers specific rules for data cleaning, plotting, and integrating with BigQuery SQL and machine learning workflows. Relevant when any of the following conditions are true: 1. The user request involves a data analysis, data exploration, data visualization, or data insights task that requires multiple steps, queries, or visualizations to answer. 2. The user explicitly requests a notebook (.ipynb). 3. You are creating, editing, or executing cells in a Jupyter notebook. 4. You need to query BigQuery from within a notebook. DO NOT use the Python BigQuery client library; instead, you MUST use the `%%bqsql` magics explained in this skill.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 83. `openfda-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\openfda_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/openfda_database)
- **Purpose:** > Query, search, and download data from the openFDA API for drugs, devices, foods, tobacco, cosmetics, animal and veterinary products, substances, and transparency data. Use for FDA adverse events, recalls, labeling, approvals, shortages, 510(k) clearances, NDC lookups, and any FDA safety or regulatory data query across all 28 API endpoints.
- **Included Subfolders:** `scripts/` (1 items: openfda_query.py); `references/` (3 items: api_endpoints.md, citation.bib, recipes.md)

### 84. `opentargets-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\opentargets_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/opentargets_database)
- **Purpose:** > Query Open Targets Platform for target-disease associations, drug target discovery, tractability/safety data, genetics/omics evidence, known drugs, for therapeutic target identification.
- **Included Subfolders:** `scripts/` (1 items: query_opentargets.py); `references/` (2 items: citation.bib, OpenTargets_GraphQL_Guide.md)

### 85. `pdb-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\pdb_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/pdb_database)
- **Purpose:** > Use when you want to search for or download experimentally-determined 3D structures for biomolecules (proteins, nucleic acids, bound ligands). Supports searching by sequence similarity, structure similarity, chemical and other attributes. Also use to get metadata about biomolecular structure experiments.
- **Included Subfolders:** `scripts/` (4 items: download_coordinate_files.py, fetch_pdb_metadata.py, fetch_schema.py, search_pdb.py); `references/` (1 items: citation.bib)

### 86. `permissioned-github`
- **Path:** [`C:\Users\Sri\.gemini\antigravity-ide\builtin\skills\permissioned-github`](file:///C:/Users/Sri/.gemini/antigravity-ide/builtin/skills/permissioned-github)
- **Purpose:** Guidelines for interacting with GitHub and request permissions from the user when commands fail due to restrictions in the agent environment.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 87. `predictingthepast`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\predictingthepast`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/predictingthepast)
- **Purpose:** > Ancient text restoration, attribution, dating, contextualization, and embedding via Aeneas (Latin) / Ithaca (Ancient Greek). Use when asked to "restore", "attribute", "date", "contextualize", "find parallels", "where was it written", "when was it written", "embed", or "analyze" an ancient text, inscription, or epigraphic document, or when the user mentions "Aeneas", or "Ithaca".
- **Included Subfolders:** `scripts/` (3 items: preprocess.py, run_inference.py, visualize_results.py); `references/` (6 items: iphi-region-sub-loc.json, iphi-region-sub.txt, led-proper-names.txt, led-region-sub-loc.json, ... (+2 more))

### 88. `protein-sequence-msa`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\protein_sequence_msa`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/protein_sequence_msa)
- **Purpose:** > Performs multiple sequence alignment of proteins with EBI Clustal Omega. Use when you need to align multiple sequences to assess similarity, domain conservation, or key residue conservation. Supports up to 4000 sequences and a maximum file size of 4 MB. Do not use to search for homologous proteins in a database (use MMseqs2, BLAST), align non-protein sequences (DNA, RNA), perform structural alignment (use Foldseek, PyMOL), or if you only have a single sequence.
- **Included Subfolders:** `scripts/` (1 items: msa_align.py); `references/` (1 items: citation.bib)

### 89. `protein-sequence-similarity-search`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\protein_sequence_similarity_search`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/protein_sequence_similarity_search)
- **Purpose:** > Searches for homologous protein sequences using MMseqs2 (fast, default) or BLAST (comprehensive, fallback). Trigger this whenever the user provides a protein sequence or FASTA file and asks to find homologues, sequence matches, or wants to infer protein function based on sequence similarity, but not when the user wants to infer protein function based on structural similarity.
- **Included Subfolders:** `scripts/` (2 items: mmseqs2_search.py, uniprot_blast.py); `references/` (1 items: citation.bib)

### 90. `pubchem-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\pubchem_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/pubchem_database)
- **Purpose:** > Query PubChem, search by name/CID/SMILES, retrieve properties, similarity/substructure searches, bioactivity, for cheminformatics. Use when a user asks about a specific chemical, drug, or molecule.
- **Included Subfolders:** `scripts/` (1 items: pubchem_api.py); `references/` (3 items: citation.bib, endpoints.md, workflows.md)

### 91. `pubmed-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\pubmed_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/pubmed_database)
- **Purpose:** >- Search PubMed for scientific literature, including published clinical trials. Fetch abstracts and full text. Link published research to biological databases (gene, protein, nucleotide, PubChem) to discover associations between papers and specific compounds or genes. Verify medical spelling, match raw citations, and cache result sets for bulk processing. Interfaces NCBI E-utilities and PMC BioC APIs.
- **Included Subfolders:** `scripts/` (1 items: pubmed_api.py); `references/` (9 items: advanced-linking.md, advanced-search.md, bulk-workflows.md, citation-matching.md, ... (+5 more))

### 92. `pymol`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\pymol`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/pymol)
- **Purpose:** > Visualize, analyze, and render protein and molecular structures using PyMOL. Use when the user wants to create images of protein structures, perform structural alignments or superposition, measure distances or contacts, highlight binding sites or active site residues, color by B-factor/pLDDT, or analyze protein-ligand interactions. Do not use for docking, molecular dynamics, or sequence-only analysis.
- **Included Subfolders:** `references/` (3 items: citation.bib, PYMOL_REFERENCE.md, RECIPES.md)

### 93. `quickgo-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\quickgo_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/quickgo_database)
- **Purpose:** > Query the QuickGO and Evidence & Conclusion Ontology (ECO) REST API. Use this when you need to map genes to biological processes, molecular functions, or cellular components, find genes associated with a specific pathway/GO term, or explore the Gene Ontology hierarchy. Do not use for querying drug targets (use OpenTargets) or mechanistic signaling pathway diagrams (use KEGG).
- **Included Subfolders:** `scripts/` (1 items: quickgo_tool.py); `references/` (5 items: annotations.md, citation.bib, eco_terms.md, gene_products.md, ... (+1 more))

### 94. `reactome-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\reactome_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/reactome_database)
- **Purpose:** > Query the Reactome database (Analysis and Content Services). Use when the user asks about pathway analysis, gene list enrichment, retrieving results by token, finding unmapped or not-found identifiers, mapping identifiers, reaction participants (inputs, outputs), pathway hierarchy (including top-level pathways), diagram export, cross-reference mapping, or searching the knowledgebase.
- **Included Subfolders:** `scripts/` (1 items: reactome_analysis.py); `references/` (2 items: api_reference.md, citation.bib)

### 95. `resolving-mcp-region-configs`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\resolving_mcp_region_configs`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/resolving_mcp_region_configs)
- **Purpose:** >- Mandatory Step 0 pre-flight check for regional Google Cloud MCP servers (e.g. Dataproc) before using MCP tools or falling back to gcloud/bq CLI. Use whenever interacting with Dataproc clusters, Spark batches, jobs, sessions, or regional GCP resources. Fixes regional MCP servers whose endpoint URL still has an unreplaced $GCP_REGION / ${REGION} placeholder across Claude Code, Codex, and Antigravity. Trigger: an expected mcp__*_{service}_* tool is missing entirely (not just failing), or a call to one fails/hangs on a malformed host. Check via ToolSearch/deferred-tools listing before falling back to gcloud/bq CLI. Asks the user for a region, patches the live MCP config file(s), and tells the user how to restart without losing session context.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 96. `schema-mapping`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\schema-mapping`](file:///C:/Users/Sri/.gemini/config/skills/schema-mapping)
- **Purpose:** Guides the process of analyzing, mapping, and documenting transformations between source and target schemas for any database, data warehouse, or data platform. Focuses exclusively on creating a high-fidelity mapping plan (Mapping Manifesto). Used when initiating an ETL, ELT, or data integration task with schema mapping specification for multiple tables (i.e. more than 3 tables) before writing code. Do NOT use this skill for basic SQL generation without mapping requirements, or when the user already has a complete mapping specification.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 97. `schema-mapping`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\data-agent-kit-plugin\skills\schema_mapping`](file:///C:/Users/Sri/.gemini/config/plugins/data-agent-kit-plugin/skills/schema_mapping)
- **Purpose:** >- Guides the process of analyzing, mapping, and documenting transformations between source and target schemas for any database, data warehouse, or data platform. Focuses exclusively on creating a high-fidelity mapping plan (Mapping Manifesto). Used when initiating an ETL, ELT, or data integration task with schema mapping specification for multiple tables (i.e. more than 3 tables) before writing code. Do NOT use this skill for basic SQL generation without mapping requirements, or when the user already has a complete mapping specification.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 98. `selfhosted-infra`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\selfhosted-infra`](file:///C:/Users/Sri/.gemini/config/skills/selfhosted-infra)
- **Purpose:** Deploy, manage, and scale self-hosted developer infrastructure, databases, and microservices. Covers Coolify (self-hosted PaaS), Supabase (Postgres + Auth + Storage), Maxun, Stirling PDF, Docker Compose orchestration, and reverse proxy networking (Traefik / Caddy).
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 99. `skill-repair`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\skill-repair`](file:///C:/Users/Sri/.gemini/config/skills/skill-repair)
- **Purpose:** Use this to fix and re-install agent skills that have failed installation. This skill provides the necessary context and permissions to surgically update the `manifest.json` after a fix has been applied.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 100. `string-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\string_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/string_database)
- **Purpose:** > Query the STRING database for protein-protein interactions (PPIs), functional enrichment, and homology. Use when the user asks about interactions between specific proteins, interaction evidence, confidence scores, protein interaction partners, or pathway enrichments.
- **Included Subfolders:** `scripts/` (1 items: string_cli.py); `references/` (5 items: citation.bib, enrichment.md, interactions.md, mapping.md, ... (+1 more))

### 101. `ucsc-conservation-and-tfbs`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\ucsc_conservation_and_tfbs`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/ucsc_conservation_and_tfbs)
- **Purpose:** > Fetch Evolutionary Conservation scores (phyloP, phastCons) and Transcription Factor Binding Sites (TFBS) from the UCSC Genome Browser. Use when analyzing whether genomic variants or regions are evolutionarily conserved, functionally important, or bounded by TF regulators across major projects (ENCODE, JASPAR, ReMap).
- **Included Subfolders:** `scripts/` (3 items: get_conservation.py, get_tfbs.py, list_tracks.py); `references/` (1 items: citation.bib)

### 102. `uiux-promax`
- **Path:** [`C:\Users\Sri\.gemini\config\skills\uiux-promax`](file:///C:/Users/Sri/.gemini/config/skills/uiux-promax)
- **Purpose:** Master skill for building next-generation, Apple-grade 3D, shader-driven, and kinetic web user interfaces. Covers React Three Fiber (R3F), ShaderGradient, WebGL liquid glass shaders, micro-animations with Anime.js, modern responsive typography, and zinc/glassmorphism design systems.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 103. `unibind-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\unibind_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/unibind_database)
- **Purpose:** >- Queries the UniBind database for experimentally validated transcription factor (TF) binding sites. Use when retrieving direct TF-DNA interaction datasets, downloading binding site coordinates (BED/FASTA) for local analysis, or listing available datasets by species, cell line, or TF name. Don't use to query specific intervals, locations, genes, motif models or expression data.
- **Included Subfolders:** `scripts/` (1 items: unibind_api.py); `references/` (1 items: citation.bib)

### 104. `uniprot-database`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\uniprot_database`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/uniprot_database)
- **Purpose:** >- Access protein metadata, function, taxonomy, and sequences across UniProtKB, UniParc, and UniRef. Use when searching for proteins, mapping identifiers, or retrieving functional annotations and publications. Don't use for sequence alignment, protein folding, or sequence similarity search (use specialized skills for those tasks).
- **Included Subfolders:** `scripts/` (1 items: uniprot_tools.py); `references/` (4 items: citation.bib, id_mapping_databases.md, search_query_fields.md, sparql_examples.md)

### 105. `uv`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\uv`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/uv)
- **Purpose:** >- Checks whether the uv Python package manager is installed and installs it if missing. Ensures uv is on PATH. Use when another skill requires uv as a prerequisite.
- **Included Subfolders:** *None (Standalone `SKILL.md`)*

### 106. `workflow-skill-creator`
- **Path:** [`C:\Users\Sri\.gemini\config\plugins\science\skills\workflow_skill_creator`](file:///C:/Users/Sri/.gemini/config/plugins/science/skills/workflow_skill_creator)
- **Purpose:** > Distills a completed user workflow or interaction into a reusable agent skill. Use when the user asks to turn their workflow, interaction, or multi-step process into a skill, or when they say "make this a skill", "create a skill from what we just did", "package this workflow" or similar. Do not use for creating skills from scratch without an existing workflow (use a generic skill-creator for that).
- **Included Subfolders:** `references/` (1 items: cli_script_template.py)
