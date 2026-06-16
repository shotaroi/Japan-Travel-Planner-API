CREATE TABLE trip_plans (
    id BIGSERIAL PRIMARY KEY,
    destination VARCHAR(100) NOT NULL,
    days INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);