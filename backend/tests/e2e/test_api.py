from models.player import Player


def test_create_game_and_query_results(client, players_repo):
    # insert two players directly into the database
    players_repo.create(Player(player_id="p1", name="Alice"))
    players_repo.create(Player(player_id="p2", name="Bob"))

    payload = {
        "date": "2026-01-01",
        "map": "Hellas",
        "expansions": [],
        "draft": False,
        "generations": 1,
        "player_results": [
            {"player_id": "p1", "corporation": "Credicor", "scores": {
                "terraform_rating": 10,
                "milestone_points": 0,
                "milestones": [],
                "award_points": 0,
                "card_points": 0,
                "card_resource_points": 0,
                "greenery_points": 0,
                "city_points": 0,
                "turmoil_points": None
            }, "end_stats": {"mc_total": 5}},
            {"player_id": "p2", "corporation": "Ecoline", "scores": {
                "terraform_rating": 5,
                "milestone_points": 0,
                "milestones": [],
                "award_points": 0,
                "card_points": 0,
                "card_resource_points": 0,
                "greenery_points": 0,
                "city_points": 0,
                "turmoil_points": None
            }, "end_stats": {"mc_total": 3}}
        ],
        "awards": []
    }

    resp = client.post("/games/", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    game_id = data["id"]

    # el informe trae el resultado (Alice primera) y se serializa entero
    r2 = client.get(f"/games/{game_id}/report")
    assert r2.status_code == 200
    report = r2.json()
    assert report["results"][0]["player_id"] == "p1"
    assert report["results"][0]["position"] == 1
    assert isinstance(report["records_broken"], list) and isinstance(report["elo"], list)


def test_player_insights_endpoint(client, players_repo):
    players_repo.create(Player(player_id="p3", name="Carol"))
    players_repo.create(Player(player_id="p4", name="Dan"))
    payload = {
        "date": "2026-02-02", "map": "Hellas", "expansions": [], "draft": False, "generations": 1, "awards": [],
        "player_results": [
            {"player_id": pid, "corporation": corp, "end_stats": {"mc_total": mc}, "scores": {
                "terraform_rating": tr, "milestone_points": 0, "milestones": [], "award_points": 0, "card_points": 0,
                "card_resource_points": 0, "greenery_points": 0, "city_points": 0, "turmoil_points": None}}
            for pid, corp, tr, mc in (("p3", "Credicor", 20, 7), ("p4", "Ecoline", 10, 3))
        ],
    }
    assert client.post("/games/", json=payload).status_code == 200

    r = client.get("/players/p3/insights")
    assert r.status_code == 200
    insights = r.json()
    assert insights["games"] == 1 and insights["wins"] == 1
