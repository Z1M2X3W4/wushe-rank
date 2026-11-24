"""Package a Vinext standalone build for deployment with Docker Compose."""

import argparse
import tarfile
import tempfile
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "wushe-rank/"


def package(standalone: Path, output: Path) -> None:
    with tempfile.TemporaryDirectory() as temp:
        runtime = Path(temp) / "runtime.tar.gz"
        with tarfile.open(runtime, "w:gz", compresslevel=6) as bundle:
            for name in ("server.js", "package.json", "dist", "node_modules", "public"):
                bundle.add(standalone / name, arcname=name)
            for migration in sorted((ROOT / "drizzle").glob("*.sql")):
                bundle.add(migration, arcname="drizzle/" + migration.name)
        output.parent.mkdir(parents=True, exist_ok=True)
        pending = output.with_suffix(output.suffix + ".part")
        with ZipFile(pending, "w", compression=ZIP_DEFLATED, strict_timestamps=False) as archive:
            archive.write(runtime, PREFIX + runtime.name, compress_type=ZIP_STORED)
            archive.write(ROOT / "docker/runtime.Dockerfile", PREFIX + "Dockerfile")
            for name in ("compose.yaml", "docker/Caddyfile", "docker/nginx.conf", "部署说明.md"):
                archive.write(ROOT / name, PREFIX + name)
            archive.writestr(PREFIX + ".dockerignore", "*\n!runtime.tar.gz\n")
        pending.replace(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("standalone", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    package(args.standalone, args.output)
