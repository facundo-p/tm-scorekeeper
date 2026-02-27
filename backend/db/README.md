migrations folder is intended for database migrations (Alembic or raw SQL).

You can initialize Alembic there with:

```
alembic init backend/db/migrations
```

and configure the `sqlalchemy.url` to use `env:DATABASE_URL`.

Make sure the SQLAlchemy models in `db/models.py` are imported in
`env.py` so that autogeneration works.


To run migration, from root
```
cd backend
export DATABASE_URL="postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper"
alembic current
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```