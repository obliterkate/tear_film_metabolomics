import pytest
from neo4j import GraphDatabase

# Connection parameters
NEO4J_URI = "bolt://localhost:7687"  # Replace with your Neo4j URI
NEO4J_USER = "neo4j"  # Replace with your username
NEO4J_PASSWORD = "password"  # Replace with your password


@pytest.fixture(scope="module")
def neo4j_driver():
    """
    Pytest fixture for setting up the Neo4j driver.
    """
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    yield driver
    driver.close()


@pytest.mark.parametrize(
    "label, name, expected_count",
    [
        ("METABOLITE", "ADP", 1),
        ("METABOLITE", "PEP", 1),
        ("PATHWAY", "PEP", 0),
        ("METABOLITE", "Nitrite", 1),
        ("METABOLITE", "UTP", 1),
    ],
)
def test_node_existence(neo4j_driver, label, name, expected_count):
    """
    Test if specific nodes with given properties exist in the database.
    """
    query = "MATCH (n:"+label+" {name: '"+name+"'}) RETURN count(n) AS count"
    print(query)
    with neo4j_driver.session() as session:
        result = session.run(query)
        count = result.single()["count"]
        assert count == expected_count, f"Expected {expected_count} nodes for {name}, but got {count}."


@pytest.mark.parametrize(
    "metabolite, pathway, expected_count",
    [
        ("ATP", "Biosynthesis of various antibiotics", 1),
        ("ATP", "Biosynthesis of secondary metabolites", 1),
        ("ATP", "A", 0),
        ("Angiotensin I", "Renin secretion", 1),
        ("DPN", "Vitamin digestion and absorption", 1)
    ],
)
def test_relationship_existence(
    neo4j_driver, metabolite, pathway, expected_count
):
    """
    Test if specific relationships exist between nodes.
    """
    query = "MATCH (n:METABOLITE {name: '" + metabolite + "'})-[r:LINKED]->(p: PATHWAY {name :'"+pathway+"'}) RETURN count(r) AS count"

    with neo4j_driver.session() as session:
        result = session.run(query)
        count = result.single()["count"]
        assert count == expected_count, f"Expected {expected_count} relationships, but got {count}."


@pytest.mark.parametrize(
    "metabolite, property, expected_value",
    [
        ("Homocysteine", "cid", 91552),
        ("Homocysteine", "canonical_smiles", "C(CS)C(C(=O)O)N"),
        ("Homocysteine", "isomeric_smiles", "C(CS)[C@@H](C(=O)O)N"),
        ("Homocysteine", "kegg_id", "C00155"),
        ("Homocysteine", "molecular_formula", "C4H9NO2S"),
    ],
)
def test_property_value(neo4j_driver, metabolite, property, expected_value):
    """
    Test if a node property has the expected value.
    """
    query = "MATCH (n:METABOLITE {name: '"+metabolite+"'}) RETURN n."+property+" AS value"
    with neo4j_driver.session() as session:
        result = session.run(query)
        value = result.single()["value"]
        assert value == expected_value, f"Expected {property} to be {expected_value}, but got {value}."


@pytest.mark.parametrize(
    "label, expected_count",
    [
        ("METABOLITE", 6578),
        ("PATHWAY", 461),
    ],
)
def test_data_count(neo4j_driver, label, expected_count):
    """
    Test the total count of nodes with a specific label.
    """
    query = f"MATCH (n:{label}) RETURN count(n) AS count"
    with neo4j_driver.session() as session:
        result = session.run(query)
        count = result.single()["count"]
        assert count == expected_count, f"Expected {expected_count} nodes with label '{label}', but got {count}."


if __name__ == "__main__":
    pytest.main()