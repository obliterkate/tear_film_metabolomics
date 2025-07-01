# What is hidden in the metabolomics of the tear film of the eye?

## Specialisations
- Artificial Intelligence (Machine/Deep Learning, NLP)
- Bioinformatics / Biomedical

## Background
Tear film samples have been collected from normal and diseased eyes.  
Mass spectrometry analysis has been performed on these samples, revealing hundreds of compounds that could uncover new discoveries and hypotheses for further investigation.

## Project Goals
Use raw data from mass spectrometry to identify pathways related to:
- The immune and inflammation system in normal and diseased eyes
- The microbes that infect and inhabit the microbiome of the eye
- External environmental effects (e.g., PFAs and microplastics)
- The effects of ageing on the eye

## Requirements and Scope
- Access to web-based bioinformatics tools and biological databases such as the Human Metabolome Database.

## Required Knowledge and Skills
- Interest in bioinformatics, algorithms, and artificial intelligence

## Expected Outcomes and Deliverables
- Preliminary data that can be used to generate clinical hypotheses for testing in vitro and in animal models

---

## Installation

1. **Download and extract the database**

   Unzip `neo4j_db.zip` so that you have a folder named `neo4j_db` in the base project directory.  
   Inside `neo4j_db`, you should see the folders:
```

data/
import/
logs/
plugins/

````

2. **Set folder permissions (Mac)**

If you are on macOS, make sure the `neo4j_db` directory has read, write, and execute permissions for all users:

```bash
chmod -R 777 neo4j_db
````

This ensures Neo4j Docker can mount the folder and use the premade database.

3. **Check storage location (Windows)**

   If you are on Windows:

   * Ensure the `neo4j_db` folder is stored **locally**, not in OneDrive or another synced directory.
   * If it is in OneDrive, move it to a local path (e.g., `C:\Users\YourName\Documents`), as Docker cannot mount volumes reliably from OneDrive.

---

## Running

Make sure Docker Desktop is installed and running.
Then in your project directory, run:

```bash
docker-compose up
```

Wait 1–2 minutes for the containers to start.

---

## Accessing the Services

* **Neo4j Database**

  URL: [http://localhost:7474](http://localhost:7474)

  When prompted for credentials:

  * **Username:** `neo4j`
  * **Password:** `password`

* **Frontend**

  URL: [http://localhost:8000](http://localhost:8000)

---

## Troubleshooting

  * Ensure Docker Desktop is running.
  * If containers do not start, try
  ```bash
    docker-compose down --volumes
    docker system prune -f
    docker-compose up --build
  ```   
  * Confirm the `neo4j_db` folder permissions are correct.
  * Verify the folder is not in OneDrive on Windows.
  * Run `docker-compose logs` to check for error messages.
  * Confirm that ports 7474, 7687, and 8000 are not being used.


