FROM postgres:17

ARG MEDIUM
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=wepublish
# Move data dir OUT of the declared VOLUME so build-time writes persist into the image
ENV PGDATA=/data

COPY ${MEDIUM}/dump.sql.gz /tmp/dump.sql.gz

# Initialize the cluster, load the dump, then shut down cleanly so the seeded
# data dir is committed into an image layer. Done inline (not via the entrypoint)
# to avoid the temp-server/exec handoff that backgrounded entrypoint scripts race on.
RUN set -e; \
    mkdir -p "$PGDATA"; \
    chown -R postgres:postgres "$PGDATA"; \
    chmod 700 "$PGDATA"; \
    gosu postgres initdb -D "$PGDATA" --auth-local=trust --auth-host=trust --username="$POSTGRES_USER"; \
    echo 'host all all all trust' >> "$PGDATA/pg_hba.conf"; \
    gosu postgres pg_ctl -D "$PGDATA" -o "-c listen_addresses=''" -w start; \
    gosu postgres psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -c "CREATE DATABASE \"$POSTGRES_DB\""; \
    gunzip -c /tmp/dump.sql.gz | gosu postgres psql --username "$POSTGRES_USER" -d "$POSTGRES_DB"; \
    gosu postgres pg_ctl -D "$PGDATA" -m fast -w stop; \
    rm -f /tmp/dump.sql.gz
