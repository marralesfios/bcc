#!/usr/bin/env python3
import os,shutil,subprocess,sys
from pathlib import Path
from typing import TypeVar
from collections.abc import Callable
(mpm := Path("mpm").resolve()).mkdir(exist_ok=True)
(pkgroot := mpm/"pkgs").mkdir(exist_ok=True)
(distdir := mpm/"dist").mkdir(exist_ok=True)
(includedir := distdir/"include").mkdir(exist_ok=True)
(libsdir := distdir/"libs").mkdir(exist_ok=True)
if not (activate := mpm/"activate.sh").exists():
    with open(activate,"w") as f:
        f.write(f"export cppinclude={includedir} cpplibs={libsdir}\n")

buildenv = os.environ.copy()
buildenv["cppinclude"] = str(includedir)
buildenv["cpplibs"] = str(libsdir)

class ErrorExec:
    @property
    def stdout(_):
        sys.exit(1)
def run(prog: Path,args: tuple[str,...],cwd: Path,stdout: int|None=None,stderr: int|None=None) -> tuple[int|str,str|None]:
    try:
        result = subprocess.run((prog.name,)+args,executable=prog,cwd=cwd,stdout=stdout,stderr=stderr,env=buildenv)
        return result.returncode,None if result.stdout is None else result.stdout.decode()
    except KeyboardInterrupt:
        print("[Interrupted]",file=sys.stderr)
        return "(interrupted)",None
def pkgparse(name: str) -> tuple[str,str]:
    if "/" in name:
        print(f"Error: disallowed \"/\" in package name: {name}")
        sys.exit(1)
    if ":" in name:
        user,repo = name.split(":",1)
        return user,repo
    else:
        return "marralesfios",name

ignores: set[str] = set()
pkgs: list[tuple[str,str]] = []
rebuild: bool = False
erroneous = False
if len(sys.argv) == 1:
    sys.argv.append("--help")
for arg in sys.argv[1:]:
    if arg == "--help" or arg == "-h":
        print("""\
Usage: mpm.py [options] pkg...
Options:
  -h, --help        Display this help message.
  --rebuild         Rebuild binary projects completely (run `make clean` first).
  --ignore-<prog>   Do not find this program from PATH, ask for its location instead
    --ignore-gcc    Do not find gcc from PATH, ask for its location instead
    --ignore-make   Do not find make from PATH, ask for its location instead
    --ignore-git    Do not find git from PATH, ask for its location instead

Package format:
[owner:]repo    = https://github.com/owner/repo
owner defaults to marralesfios (the main BCC developer) if unspecified.""",file=sys.stderr)
        sys.exit(0)
    elif arg == "--rebuild":
        rebuild = True
    elif arg.startswith("--ignore-"):
        ignores.add(arg[9:])
    elif arg.startswith("--"):
        print(f"Error: unknown option {arg}",file=sys.stderr)
        erroneous = True
    else:
        pkgs.append(pkgparse(arg))
if erroneous:
    sys.exit(1)
if not pkgs:
    print("Error: no packages specified.",file=sys.stderr)
    sys.exit(1)
def getpkgcanonname(user: str,repo: str) -> str:
    return f"{user}:{repo}"
def getpkgdirname(user: str,repo: str) -> Path:
    return pkgroot/f"{user}_{repo}"
def getpkgurl(user: str,repo: str) -> str:
    return f"https://github.com/{user}/{repo}"
def unquote(pth: str) -> str:
    if pth.startswith("'") and pth.endswith("'"):
        return pth[1:-1].replace("\\'","'")
    return pth
def graceful_input(prompt: str) -> str:
    try:
        return input(prompt)
    except KeyboardInterrupt:
        print("\nExit",file=sys.stderr)
        sys.exit(1)
def rdpath(prompt: str) -> Path:
    return Path(unquote(graceful_input(prompt)))
def locate(prog: str,*alternatives: str) -> Path:
    if prog not in ignores:
        for attempt in (prog,)+alternatives:
            if (file := shutil.which(attempt)) is not None:
                return Path(file)
    while True:
        file = rdpath(f"Cannot find {prog} on your PATH. Enter its location (either the file path itself, or the containing folder is fine): ")
        if file.is_file():
            return file
        elif file.is_dir():
            if (inner := file/prog).is_file():
                return inner
            else:
                print("The program can't be found in this directory.")
        else:
            print("This path doesn't exist.")
T = TypeVar("T")
def runrq(fn: Callable[[],T],handle: Callable[[T],None]) -> None:
    while True:
        if (err := fn()):
            handle(err)
            while True:
                opt = graceful_input("Retry or quit? [Rq]").lower()
                match opt:
                    case "" | "r":
                        break
                    case "q":
                        sys.exit(1)
                    case _:
                        pass
        else:
            break
print("(Note: whenever a path is required, it's OK to drag and drop a file/folder into the terminal window. If the path is quoted, we'll unescape it for you.)")
gcc = locate("gcc")
gccver = run(gcc,("-dumpfullversion",),gcc.parent,stdout=subprocess.PIPE)[1]
if gccver is None:
    print("Error: cannot run GCC to determine version.")
    sys.exit(1)
gccver = int(gccver[:gccver.index(".")])
if gccver < 16:
    print(f"Error: Projects generally require GCC 16 or higher to compile. You have GCC {gccver}. To manually select a GCC executable, rerun with --ignore-gcc.",file=sys.stderr)
    sys.exit(1)
make = locate("make","mingw32-make")
git = locate("git")
def try_to_pull(pkgdir: Path,pkgname: str) -> int|str:
    print(f"Updating package {pkgname}...")
    return run(git,("pull",),pkgdir)[0]
def try_to_clone(pkgdir: Path,pkgurl: str,pkgname: str) -> int|str:
    print(f"Cloning package {pkgname}...")
    return run(git,("clone",pkgurl,str(pkgdir)),pkgroot)[0]
def try_to_setup(pkgdir: Path,pkgname: str) -> int|str:
    print(f"Setting up package {pkgname}...")
    # This will fail on the second run and afterwards, which is expected.
    # We swallow all errors, because if all our previous integrity checks succeeded, and making the dirs failed, then something is very very wrong and we probably can't do anything about it anyway.
    run(make,("setup",),pkgdir,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    return run(make,("clean",),pkgdir)[0] if rebuild else 0
def try_to_build(pkgdir: Path,pkgname: str) -> int|str:
    print(f"Building package {pkgname}...")
    return  run(make,("-j",),pkgdir)[0]

pkginf = [(getpkgcanonname(user,repo),getpkgurl(user,repo),getpkgdirname(user,repo),repo) for user,repo in pkgs]

print("Updating packages...")
for pkgname,pkgurl,pkgdir,_ in pkginf:
    canary = pkgdir/"__clone_valid"
    if pkgdir.is_dir():
        if canary.exists():
            runrq(lambda:try_to_pull(pkgdir,pkgname),lambda err:print(f"Failed to update package (err {err})!"))
            continue
        print(f"Package cache for {pkgname} seems corrupt. Deleting {pkgdir}...")
        shutil.rmtree(pkgdir)
    runrq(lambda:try_to_clone(pkgdir,pkgurl,pkgname),lambda err:print(f"Failed to clone package (err {err})!"))
    canary.touch()
    print(f"Finished cloning {pkgdir}.")

def symlink(src: Path,dst: Path,name:str|None=None):
    if name is None:
        name = src.name
    print(f"Symlinking {src.name} to {dst.name}/{name}...")
    target = dst/name
    if target.exists(follow_symlinks=False):
        if not target.is_symlink():
            print(f"Error: {target} exists in {dst.name}, but is not a symlink.")
            while ((opt := graceful_input("Delete? [yN]")).lower() or "n") not in "yn":
                pass
            if opt == "n":
                print("Cannot proceed, exiting.",file=sys.stderr)
                sys.exit(1)
            if target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink()
            target.symlink_to(src,src.is_dir())
        elif target.readlink().resolve() != src:
            print(f"Link exists, but seems to be pointing to the wrong location. Adjusting...")
            target.unlink()
            target.symlink_to(src,src.is_dir())
    else:
        target.symlink_to(src,src.is_dir())

print("Building packages...")
for pkgname,_,pkgdir,repo in pkginf:
    os.chdir(pkgdir)
    if (pkgdir/"src").is_dir():
        print(f"{pkgname} seems to be a binary package, building...")
        runrq(lambda:try_to_setup(pkgdir,pkgname),lambda err:print(f"Failed to set up {pkgname} (err {err})!"))
        runrq(lambda:try_to_build(pkgdir,pkgname),lambda err:print(f"Failed to build {pkgname} (err {err})!"))
        headdir = pkgdir/"src"/"include"
        if headdir.is_dir():
            for item in headdir.iterdir():
                symlink(item,includedir)
        else:
            print("Warning: include directory not found. Package headers will not be symlinked.")
            headdir = None
        libdir = pkgdir/"lib"
        if libdir.is_dir():
            for item in libdir.iterdir():
                libname = item.name
                if not libname.startswith("lib"):
                    libname = "lib"+libname
                symlink(item,libsdir,libname)
        else:
            print("Warning: library binary directory not found. Static libraries will not be symlinked.")
    else:
        symlink(pkgdir,includedir,repo)
