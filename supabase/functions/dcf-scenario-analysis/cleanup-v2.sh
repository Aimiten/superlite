#!/bin/bash

# DCF Scenario Analysis V2 Cleanup Script
# This script safely removes old versions and updates imports

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
DRY_RUN=false
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run]"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}=== DCF Scenario Analysis V2 Cleanup Script ===${NC}"
echo -e "${YELLOW}Working directory: $SCRIPT_DIR${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Running in DRY-RUN mode - no files will be modified${NC}\n"
else
    echo -e "${RED}Running in LIVE mode - files will be modified!${NC}"
    read -p "Are you sure you want to proceed? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Cleanup cancelled."
        exit 0
    fi
fi

# Define old files to remove
declare -a OLD_FILES=(
    "variants/combined-executor.ts"
    "schemas/deprecated/forward-looking-dcf-schema.ts"
    "schemas/deprecated/full-dcf-schema.ts"
    "schemas/deprecated/simplified-dcf-schema.ts"
)

# Define new files to keep
declare -a NEW_FILES=(
    "variants/combined-executor-v2.ts"
    "variants/variant-executor.ts"
    "variants/variant-schemas.ts"
    "variants/variant-utils.ts"
    "variants/phase2-executor.ts"
    "variants/prompts.ts"
    "schemas/parameter-schemas.ts"
)

echo -e "\n${BLUE}=== Step 1: Files to be DELETED ===${NC}"
for file in "${OLD_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        echo -e "${RED}  ✗ $file${NC}"
    else
        echo -e "${YELLOW}  - $file (not found)${NC}"
    fi
done

echo -e "\n${BLUE}=== Step 2: Files to be KEPT ===${NC}"
for file in "${NEW_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        echo -e "${GREEN}  ✓ $file${NC}"
    else
        echo -e "${RED}  ✗ $file (missing!)${NC}"
    fi
done

echo -e "\n${BLUE}=== Step 3: Checking for broken imports ===${NC}"

# Check for imports of files to be deleted
BROKEN_IMPORTS=false
for old_file in "${OLD_FILES[@]}"; do
    # Remove .ts extension and convert to import path
    import_path="${old_file%.ts}"
    
    # Search for imports of this file
    echo -e "\n${YELLOW}Checking imports of: $import_path${NC}"
    
    # Find imports in TypeScript files
    if grep -r "from.*['\"].*$import_path['\"]" "$SCRIPT_DIR" --include="*.ts" --include="*.js" --exclude-dir="backup-*" 2>/dev/null | grep -v "$old_file"; then
        echo -e "${RED}  Found imports that will break!${NC}"
        BROKEN_IMPORTS=true
    else
        echo -e "${GREEN}  No imports found${NC}"
    fi
done

# Check for direct references to combined-executor (without -v2)
echo -e "\n${YELLOW}Checking for references to combined-executor (non-v2)${NC}"
if grep -r "combined-executor" "$SCRIPT_DIR" --include="*.ts" --include="*.js" --exclude-dir="backup-*" 2>/dev/null | grep -v "combined-executor-v2" | grep -v "\.md" | grep -v "cleanup-v2.sh"; then
    echo -e "${RED}  Found references to old combined-executor!${NC}"
    BROKEN_IMPORTS=true
else
    echo -e "${GREEN}  No references to old combined-executor found${NC}"
fi

if [ "$BROKEN_IMPORTS" = true ]; then
    echo -e "\n${RED}WARNING: Broken imports detected! These need to be fixed.${NC}"
fi

# Create backup if not in dry-run mode
if [ "$DRY_RUN" = false ]; then
    echo -e "\n${BLUE}=== Step 4: Creating backup ===${NC}"
    mkdir -p "$SCRIPT_DIR/$BACKUP_DIR"
    
    for file in "${OLD_FILES[@]}"; do
        if [ -f "$SCRIPT_DIR/$file" ]; then
            # Create directory structure in backup
            dir=$(dirname "$file")
            mkdir -p "$SCRIPT_DIR/$BACKUP_DIR/$dir"
            
            echo -e "  Backing up: $file -> $BACKUP_DIR/$file"
            cp "$SCRIPT_DIR/$file" "$SCRIPT_DIR/$BACKUP_DIR/$file"
        fi
    done
    echo -e "${GREEN}Backup created in: $BACKUP_DIR${NC}"
fi

# Delete old files if not in dry-run mode
if [ "$DRY_RUN" = false ]; then
    echo -e "\n${BLUE}=== Step 5: Deleting old files ===${NC}"
    for file in "${OLD_FILES[@]}"; do
        if [ -f "$SCRIPT_DIR/$file" ]; then
            echo -e "  Deleting: $file"
            rm "$SCRIPT_DIR/$file"
        fi
    done
    
    # Remove empty deprecated directory if it exists
    if [ -d "$SCRIPT_DIR/schemas/deprecated" ]; then
        # Check if directory is empty (except for README)
        if [ -z "$(ls -A "$SCRIPT_DIR/schemas/deprecated" | grep -v README)" ]; then
            echo -e "  Removing empty deprecated directory"
            rm -rf "$SCRIPT_DIR/schemas/deprecated"
        fi
    fi
fi

echo -e "\n${BLUE}=== Step 6: Updating remaining imports ===${NC}"

# Define import replacements
declare -A IMPORT_REPLACEMENTS=(
    ["combined-executor"]="combined-executor-v2"
    ["./schemas/deprecated/simplified-dcf-schema"]="./schemas/parameter-schemas"
    ["./schemas/deprecated/forward-looking-dcf-schema"]="./schemas/parameter-schemas"
    ["./schemas/deprecated/full-dcf-schema"]="./schemas/parameter-schemas"
)

# Update imports in all TypeScript files
for old_import in "${!IMPORT_REPLACEMENTS[@]}"; do
    new_import="${IMPORT_REPLACEMENTS[$old_import]}"
    
    echo -e "\n${YELLOW}Replacing: $old_import -> $new_import${NC}"
    
    # Find files that need updating
    files_to_update=$(grep -rl "$old_import" "$SCRIPT_DIR" --include="*.ts" --include="*.js" --exclude-dir="backup-*" 2>/dev/null || true)
    
    if [ -n "$files_to_update" ]; then
        while IFS= read -r file; do
            if [ "$DRY_RUN" = true ]; then
                echo -e "  Would update: $file"
            else
                echo -e "  Updating: $file"
                # Use sed to replace imports
                sed -i.bak "s|$old_import|$new_import|g" "$file"
                # Remove backup file
                rm "${file}.bak"
            fi
        done <<< "$files_to_update"
    else
        echo -e "${GREEN}  No files need updating${NC}"
    fi
done

echo -e "\n${BLUE}=== Step 7: Final verification ===${NC}"

# Check for any remaining broken references
FINAL_CHECK_FAILED=false

echo -e "\n${YELLOW}Checking for remaining references to deleted files...${NC}"
for old_file in "${OLD_FILES[@]}"; do
    import_path="${old_file%.ts}"
    
    if grep -r "$import_path" "$SCRIPT_DIR" --include="*.ts" --include="*.js" --exclude-dir="backup-*" 2>/dev/null | grep -v "cleanup-v2.sh"; then
        echo -e "${RED}  Still found references to: $import_path${NC}"
        FINAL_CHECK_FAILED=true
    fi
done

# Check for combined-executor references (without -v2)
if grep -r "combined-executor['\"]" "$SCRIPT_DIR" --include="*.ts" --include="*.js" --exclude-dir="backup-*" 2>/dev/null | grep -v "combined-executor-v2" | grep -v "cleanup-v2.sh"; then
    echo -e "${RED}  Still found references to old combined-executor!${NC}"
    FINAL_CHECK_FAILED=true
fi

if [ "$FINAL_CHECK_FAILED" = false ]; then
    echo -e "${GREEN}✓ No broken references found!${NC}"
else
    echo -e "${RED}✗ Broken references still exist!${NC}"
fi

# Summary
echo -e "\n${BLUE}=== Cleanup Summary ===${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY-RUN completed. No files were modified.${NC}"
    echo -e "Run without --dry-run to perform actual cleanup."
else
    echo -e "${GREEN}Cleanup completed!${NC}"
    echo -e "Backup created in: ${YELLOW}$BACKUP_DIR${NC}"
    
    if [ "$FINAL_CHECK_FAILED" = true ]; then
        echo -e "${RED}WARNING: Some broken references may still exist. Please check manually.${NC}"
    else
        echo -e "${GREEN}All references updated successfully!${NC}"
    fi
fi

echo -e "\n${BLUE}=== Recommended Next Steps ===${NC}"
echo "1. Run tests to ensure everything works: ./tests/run-tests.sh"
echo "2. Check git status to review changes: git status"
echo "3. If issues arise, restore from backup: $BACKUP_DIR"
echo "4. Deploy the updated function: ./deploy-v2.sh"