# Project Title
What is hidden in the metabolomics of the tear film of the eye?
# Specialisations
Artificial intelligence (Machine/ Deep learning, NLP); Bioinformatics/Biomedical
# Background
Tear film samples have been collected from normal and diseased eyes.
Mass spectrometry analysis has been run on these samples (revealing hundreds of compounds that could reveal new discoveries and hypotheses that can be further tested.)
# Project Goals
Use raw data from mass spectrometry to find pathways that could lead to discoveries about:
The immune and inflammation system in normal and diseased eyes
The microbes that infect and live in the microbiome of the eye
External environmental effects such as PFAs and microplastics in the eye
The effects of ageing on the eye
# Requirements and scope
Access to web-based bioinformatic tools and biological databases like the human metabolome.
# Required knowledge and skills
Interest in bioinformatics, algorithms, and artificial intelligence
# Expected outcomes/deliverables
Preliminary data that can be acted on to determine clinical hypotheses that can be tested in vitro and in animal models

# Installation
Unzip the neo4j_db.zip, make sure that there is a folder in the base directory named neo4j_db and inside are the folders, "data", "import", "logs" and "plugins".
## Mac
If it is a Mac make sure the permissions are read, write and execute for all if it isn't use the command,

`chmod -R 777 neo4j_db`

This will allow the neo4j docker to mount with the correct files and use the premade database.

## Windows
If it is a windows computer make sure that the folder is stored locally and not in OneDrive, if it is stored in OneDrive docker will not be able to properly mount the folder correctly. If it is in OneDrive download it locally and place it in the same directory.

## Running
Once neo4j_db has been properly setup run the command,

`docker-compose up`

Wait a minute or two for this to setup then you can check neo4j database at http://localhost:7474/
Once prompted for a username and password:
Username: neo4j
Password: password
Then use the frontend at http://localhost:8000/.
