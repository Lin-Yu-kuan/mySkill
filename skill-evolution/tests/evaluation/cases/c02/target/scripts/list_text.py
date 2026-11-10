import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
print(json.dumps(sorted(
    path.name for path in root.glob("*.txt")
    if path.is_file() and not path.is_symlink()
), ensure_ascii=False))
