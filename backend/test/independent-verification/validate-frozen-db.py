"""Run the unchanged frozen validator, redirecting only its evidence destination."""
from pathlib import Path

root = Path(__file__).resolve().parents[3]
runner = root / 'database' / 'test' / 'run_validation.py'
destination = root / 'docs' / 'post-remediation-evidence' / 'frozen-db'
destination.mkdir(parents=True, exist_ok=True)
source = runner.read_text(encoding='utf-8')
original = "EVIDENCE = ROOT / 'database' / 'evidence'"
if source.count(original) != 1:
    raise RuntimeError('Validator output redirection contract changed')
source = source.replace(original, 'EVIDENCE = pathlib.Path(' + repr(str(destination)) + ')', 1)
exec(compile(source, str(runner), 'exec'), {'__file__': str(runner), '__name__': '__main__'})
