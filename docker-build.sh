#!/bin/bash

# Docker Build Helper Script for Radio Elgean
# Usage: ./docker-build.sh [dev|prod|all] [push]

set -e

VERSION="1.0.0"
REGISTRY="${DOCKER_REGISTRY:-radio-elgean}"

print_usage() {
    echo "Usage: $0 [dev|prod|all] [push]"
    echo ""
    echo "Build targets:"
    echo "  dev     Build development image with hot-reload"
    echo "  prod    Build optimized production image"
    echo "  all     Build both dev and prod images (default)"
    echo ""
    echo "Options:"
    echo "  push    Push images to registry after building"
    echo ""
    echo "Examples:"
    echo "  $0 dev                 # Build dev image only"
    echo "  $0 prod push           # Build and push prod image"
    echo "  $0 all push            # Build and push both images"
    echo ""
    echo "Environment Variables:"
    echo "  DOCKER_REGISTRY        Docker registry/namespace (default: radio-elgean)"
    echo ""
}

build_dev() {
    echo ""
    echo "======================================"
    echo "Building Development Image"
    echo "======================================"
    echo ""

    docker build \
        --target development \
        -t "$REGISTRY:dev-latest" \
        -t "$REGISTRY:dev-$VERSION" \
        -f Dockerfile \
        .

    echo ""
    echo "[✓] Development image built:"
    echo "    - $REGISTRY:dev-latest"
    echo "    - $REGISTRY:dev-$VERSION"
}

build_prod() {
    echo ""
    echo "======================================"
    echo "Building Production Image"
    echo "======================================"
    echo ""

    docker build \
        --target production \
        -t "$REGISTRY:latest" \
        -t "$REGISTRY:$VERSION" \
        -t "$REGISTRY:prod-latest" \
        -t "$REGISTRY:prod-$VERSION" \
        -f Dockerfile \
        .

    echo ""
    echo "[✓] Production image built:"
    echo "    - $REGISTRY:latest"
    echo "    - $REGISTRY:$VERSION"
    echo "    - $REGISTRY:prod-latest"
    echo "    - $REGISTRY:prod-$VERSION"
}

push_images() {
    echo ""
    echo "======================================"
    echo "Pushing Images to Registry"
    echo "======================================"
    echo ""

    if [[ "$1" == "dev" ]] || [[ "$1" == "all" ]]; then
        echo "[*] Pushing development images..."
        docker push "$REGISTRY:dev-latest"
        docker push "$REGISTRY:dev-$VERSION"
        echo "[✓] Development images pushed"
    fi

    if [[ "$1" == "prod" ]] || [[ "$1" == "all" ]]; then
        echo "[*] Pushing production images..."
        docker push "$REGISTRY:latest"
        docker push "$REGISTRY:$VERSION"
        docker push "$REGISTRY:prod-latest"
        docker push "$REGISTRY:prod-$VERSION"
        echo "[✓] Production images pushed"
    fi
}

show_images() {
    echo ""
    echo "======================================"
    echo "Built Images"
    echo "======================================"
    echo ""
    docker images | grep "$REGISTRY"
    echo ""
}

main() {
    local target="${1:-all}"
    local push_flag="${2:-}"

    if [[ "$target" == "-h" ]] || [[ "$target" == "--help" ]]; then
        print_usage
        exit 0
    fi

    case "$target" in
        dev)
            build_dev
            ;;
        prod)
            build_prod
            ;;
        all)
            build_dev
            build_prod
            ;;
        *)
            echo "Error: Unknown target '$target'"
            print_usage
            exit 1
            ;;
    esac

    show_images

    if [[ "$push_flag" == "push" ]]; then
        push_images "$target"
    fi

    echo ""
    echo "======================================"
    echo "Build Complete!"
    echo "======================================"
    echo ""

    if [[ "$push_flag" != "push" ]]; then
        echo "To push images to registry, run:"
        if [[ "$target" == "dev" ]]; then
            echo "  docker push $REGISTRY:dev-latest"
        elif [[ "$target" == "prod" ]]; then
            echo "  docker push $REGISTRY:latest"
        else
            echo "  docker push $REGISTRY:dev-latest"
            echo "  docker push $REGISTRY:latest"
        fi
        echo ""
    fi

    echo "To run the application:"
    if [[ "$target" == "prod" ]] || [[ "$target" == "all" ]]; then
        echo "  Production: docker-compose -f docker-compose.prod.yml up"
    fi
    if [[ "$target" == "dev" ]] || [[ "$target" == "all" ]]; then
        echo "  Development: docker-compose up"
    fi
    echo ""
}

main "$@"
