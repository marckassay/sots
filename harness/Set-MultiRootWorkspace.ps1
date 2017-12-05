<#
.SYNOPSIS
Moves a file and a folder to set-up Multi-Root Workspace for VS Code.

.Description 
Set-MultiRootWorkspace moves the 'sotsHarness' folder and 'sots.code-workspace' file in sots's parent directory to
set-up a Multi-Root Workspace for VS Code.

.PARAMETER  Launch
If the 'Launch' switch param is used, it will Invoke-Expression use 'sots.code-workspace' to launch and create
Multi-Root Workspace for VSCode.  Otherwise you can simply right-click on the 'sots.code-workspace' to launch
VSCode in Multi-Root Workspace.

.EXAMPLE
$ . .\Set-MultiRootWorkspace.ps1

.EXAMPLE
$ . .\Set-MultiRootWorkspace.ps1 -Launch
#>
function Set-MultiRootWorkspace {
    param
    (
        [switch]$Launch
    )

    $PSScriptRoot = $MyInvocation.PSScriptRoot
    $SotsParentDirectory = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
    Move-Item -Path "$PSScriptRoot\sots.code-workspace" -Destination $SotsParentDirectory -Verbose
    Move-Item -Path "$PSScriptRoot\sotsHarness" -Destination $SotsParentDirectory -Verbose
    Push-Location -Verbose
    Set-Location -Path $SotsParentDirectory -Verbose

    if ($Launch) {
        Invoke-Expression -Command 'code sots.code-workspace' -Verbose
    }

    Pop-Location -Verbose
}
Set-MultiRootWorkspace