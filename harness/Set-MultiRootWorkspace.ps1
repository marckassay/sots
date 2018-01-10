<#
.SYNOPSIS
Moves a file and a folder to set-up Multi-Root Workspace for VS Code.

.Description
Set-MultiRootWorkspace moves the 'sotsHarness' folder and 'sots.code-workspace' file in sots's parent directory to
set-up a Multi-Root Workspace for VS Code.

.EXAMPLE
$ . .\Set-MultiRootWorkspace.ps1

#>
function Set-MultiRootWorkspace {
    $PSScriptRoot = $MyInvocation.PSScriptRoot
    $SotsParentDirectory = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
    Copy-Item -Path "$PSScriptRoot\sots.code-workspace" -Destination $SotsParentDirectory -Verbose
    Copy-Item -Path "$PSScriptRoot\sotsHarness" -Destination $SotsParentDirectory -Recurse -Verbose
    Push-Location -Verbose
    Set-Location -Path $SotsParentDirectory -Verbose

    Pop-Location -Verbose
}
Set-MultiRootWorkspace
