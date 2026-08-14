import os
from PIL import Image

def generate():
    logo_path = 'public/logo.png'
    if not os.path.exists(logo_path):
        print(f"Error: {logo_path} not found")
        return
        
    img = Image.open(logo_path)
    
    # Generate PNG favicons
    sizes = [32, 48, 96, 144, 192]
    for size in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(f'public/favicon-{size}x{size}.png')
        print(f"Generated favicon-{size}x{size}.png")
        
    # Generate favicon.ico containing 16, 32, 48
    ico_img = Image.open(logo_path)
    ico_img.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print("Generated favicon.ico with 16, 32, and 48 sizes")

if __name__ == '__main__':
    generate()
