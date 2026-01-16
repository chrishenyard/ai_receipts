FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app

USER root
RUN apt-get update && apt-get install -y sqlite3 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/db \
    && chown -R $APP_UID:$APP_UID /app/db \
    && chmod -R 777 /app/db

USER $APP_UID
EXPOSE 8080
EXPOSE 8081

ARG AUTHORS
ARG VERSION
ARG TITLE
ARG DESCRIPTION
ARG BUILD_DATE

# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk@sha256:c7445f141c04f1a6b454181bd098dcfa606c61ba0bd213d0a702489e5bd4cd71 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Directory.Packages.props", "."]
COPY ["AI.Receipts/AI.Receipts.csproj", "AI.Receipts/"]
RUN dotnet restore "./AI.Receipts/AI.Receipts.csproj"
COPY . .
WORKDIR "/src/AI.Receipts"
RUN dotnet build "./AI.Receipts.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./AI.Receipts.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=build /src/AI.Receipts/entrypoint.sh /app/entrypoint.sh

LABEL \
    org.opencontainers.image.created="${BUILD_DATE}" \
    org.opencontainers.image.authors="${AUTHORS}" \
    org.opencontainers.image.title="${TITLE}" \
    org.opencontainers.image.description="${DESCRIPTION}" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.licenses="Apache-2.0"

ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]
