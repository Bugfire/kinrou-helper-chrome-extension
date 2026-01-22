.PHONY: build clean dist install check watch

EXTENSION_NAME = kinrou-helper-chrome-extension
BUILD_DIR = build
DIST_DIR = dist
ZIP_FILE = $(BUILD_DIR)/$(EXTENSION_NAME).zip

# Install dependencies
setup:
	@npm ci

# Build distribution
dist: clean
	@npx tsc
	@cp src/manifest.json $(DIST_DIR)/
	@cp src/styles.css $(DIST_DIR)/
	@cp src/popup.html $(DIST_DIR)/
	@echo "Built to $(DIST_DIR)/"

# Create zip for Chrome Web Store
build: dist
	@mkdir -p $(BUILD_DIR)
	@cd $(DIST_DIR) && zip -r ../$(ZIP_FILE) .
	@echo "Created: $(ZIP_FILE)"

clean:
	@rm -rf $(BUILD_DIR) $(DIST_DIR)
	@echo "Cleaned build directory"
