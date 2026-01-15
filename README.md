# AI Receipt Scanner and Categorizer
This project is an AI-powered receipt scanner and categorizer that helps users digitize and organize their receipts efficiently. It leverages Optical Character Recognition (OCR) to extract text from images of receipts and uses machine learning algorithms to categorize them into predefined categories such as groceries, dining, utilities, etc.

## Features
- **Receipt Scanning**: Upload images of receipts in various formats (JPEG, PNG, PDF).
- **Optical Character Recognition (OCR)**: Extract text from receipt images using OCR technology.
- **Categorization**: Automatically categorize receipts into predefined categories.
- **Search and Filter**: Search and filter receipts based on date, category, or amount.
- **Export Options**: Export categorized receipts to CSV or PDF format.

## Docker GPU Support
This project supports GPU acceleration for faster OCR processing. To run the application with GPU support, ensure you have the necessary NVIDIA drivers and Docker installed on your system. Use the following link for GPU installation instructions:
https://docs.ollama.com/docker

## Ollama Image
This project utilizes the ministral-3:14b model from Ollama for enhanced performance. Run the following command after Ollama starts:
- `docker exec -it ollama ollama pull llama2`

