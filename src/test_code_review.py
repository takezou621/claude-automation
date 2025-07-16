#!/usr/bin/env python3
"""
Test file for code review workflow
"""

import os
import logging

# Test for console.log detection (should trigger warning)
console.log = lambda x: print(f"DEBUG: {x}")

def test_function():
    """Test function with some code quality issues"""
    
    # This should trigger a warning in code review
    console.log("This is a test message")
    
    # Good code practices
    logger = logging.getLogger(__name__)
    logger.info("Test function executed")
    
    return True

def main():
    """Main function"""
    result = test_function()
    print(f"Test result: {result}")

if __name__ == "__main__":
    main()
