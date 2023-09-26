import io
import PIL
import PIL.Image
import PIL.ImageOps
import base64

def render_loom_file(loom_file: str, file_extension: str, output_format: str, loom_width: int, desired_height: int, invert: bool, tabby_width: int):
    # Decode loom file from base64
    img_data = base64.b64decode(str(loom_file))
    loom_image = PIL.Image.open(io.BytesIO(img_data ))

    # Get the loom image width and height
    loom_image_width, loom_image_height = loom_image.size

    # If the desired height isn't 0, calculate the new width/height
    if desired_height != 0:
        # Calculate new width/height
        new_width = int(loom_image_width * (desired_height / loom_image_height))
        new_height = desired_height

        # If the width is too large, clamp it to the loom width
        # then recalculate the height
        if new_width > loom_width:
            new_width = loom_width
            new_height = int(loom_image_height * (loom_width / loom_image_width))
            

        # Resize the loom image
        loom_image = loom_image.resize((new_width, new_height), PIL.Image.ANTIALIAS)

    loom_image_width, loom_image_height = loom_image.size

    # If it's smaller then the loom width, place it in the center of a blank image
    # and increase tabby width to fill the rest of the space
    if loom_image_width < loom_width:
        # Calculate the blank space on either side of the image
        blank_space = loom_width - loom_image_width

        # Calculate the tabby width
        tabby_width = max(blank_space // 2, tabby_width)

        # Create a new blank image
        new_image = PIL.Image.new('L', (loom_width, loom_image_height), 255)

        # Paste the loom image in the center of the blank image
        new_image.paste(loom_image, (blank_space // 2, 0))

        # Set the loom image to the new image
        loom_image = new_image


    # Dither the image
    loom_image = loom_image.convert('1', dither=PIL.Image.FLOYDSTEINBERG)

    # Invert the image if necessary
    if invert:
        loom_image = PIL.ImageOps.invert(loom_image)

    # Apply loom filter to ensure no more then 5 black pixels
    # in a row or 5 white pixels in a column
    loom_image = correct_image(loom_image)
        

    # Add tabby
    if tabby_width > 0:
        # Repeat pattern as follows (example for tabby width of 5):
        # 1 0 1 0 1
        # 0 1 0 1 0
        # on both sides of the image

        for row in range(0, loom_image.height):
            # Alternate between white and black starting rows
            base = row % 2 == 0
            
            for i in range(tabby_width):
                # Alternate between white and black pixels, starting with the base
                if base:
                    pixel = i % 2 == 0
                else:
                    pixel = i % 2 == 1

                loom_image.putpixel((i, row), 255 if pixel else 0)
                loom_image.putpixel((loom_image.width - i - 1, row), 255 if pixel else 0)

    # Save the loom image in memory as .tiff, then convert to b64
    img_byte_arr = io.BytesIO()
    loom_image.save(img_byte_arr, format='png')
    img_byte_arr = img_byte_arr.getvalue()
    loom_image = base64.standard_b64encode(img_byte_arr)

    # Return the loom image
    return loom_image


def correct_image(image):
    # Open the dithered image and convert it to black and white (1-bit)
    width, height = image.size

    # Correct the rows
    for y in range(height):
        consecutive_white_pixels = 0
        for x in range(width):
            pixel = image.getpixel((x, y))
            if pixel == 255:  # Black pixel
                consecutive_white_pixels += 1
                if consecutive_white_pixels > 5:
                    if y % 2 == 0:
                        image.putpixel((x, y), 0)  # Change to white pixel
                    else:
                        image.putpixel((x - 1, y), 0)  # Change the previous pixel to white
                    consecutive_white_pixels = 1
            else:
                consecutive_white_pixels = 0

    # Correct the columns
    for x in range(width):
        consecutive_black_pixels = 0
        for y in range(height):
            pixel = image.getpixel((x, y))
            if pixel == 0:  # White pixel
                consecutive_black_pixels += 1
                if consecutive_black_pixels > 5:
                    if x % 2 == 0:
                        image.putpixel((x, y), 255)  # Change to black pixel
                    else:
                        image.putpixel((x, y - 1), 255)  # Change the previous pixel to black
                    consecutive_black_pixels = 1
            else:
                consecutive_black_pixels = 0


    return image