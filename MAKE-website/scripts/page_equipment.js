const laser3d_equipment = [
    {
        name: "Full Spectrum PS48 Laser Cutter",
        description: "Massive CO2 laser cutter that can cut & engrave on a variety of materials, such as wood, acrylic, and cardboard.",
        image: "img/equipment/fslaser.webp",
        manual: "https://docs.google.com/document/d/1JNqDC9X5x_eaMU51Pfan4zC-YUiqhW1XqpONjFzrzyM/edit#heading=h.skjsghxs3yl6"
    },
    {
        name: "Epilog Laser Cutter",
        description: "Smaller laser cutter, faster and more accurate then the full spectrum laser cutter, but with reduced cutting area.",
        image: "img/equipment/epiloglaser.webp",
        manual: "https://docs.google.com/document/d/1JNqDC9X5x_eaMU51Pfan4zC-YUiqhW1XqpONjFzrzyM/edit#heading=h.p54qzrkefqd4"
    },
    {
        name: "FLSUN SR 3D Printers",
        description: "Delta FDM 3D printers that excel at printing PLA and ABS quickly, with speeds ranging from 80mm/s to 200mm/s.",
        image: "img/equipment/flsunsr.webp",
        manual: "https://docs.google.com/document/d/1gDvmQBr8GSX1x4c6m6gHaMW2nl4jzUDritskwbLwQwI/edit#heading=h.e36rdnc8fyom"
    },
    {
        name: "Prusa i3 MK3S+ 3D Printers",
        description: "Cartesian FDM 3D printers that can print PLA, ABS, TPU, and many other materials. Slower than the FLSUN SR 3D printers, but can be tuned for higher quality prints.",
        image: "img/equipment/prusa.webp",
        manual: "https://docs.google.com/document/d/1gDvmQBr8GSX1x4c6m6gHaMW2nl4jzUDritskwbLwQwI/edit#heading=h.e36rdnc8fyom"
    },
    {
        name: "Markforged Onyx One 3D Printers",
        description: "Cartesian FDM 3D printers that prints Onyx, a carbon-fiber/nylon composite filament. Onyx filament is micro carbon fiber filled nylon, which produces very strong, very durable, and slightly flexible prints. Filament is charged at-cost to the user.",
        image: "img/equipment/onyx.webp",
        manual: "https://docs.google.com/document/d/1gDvmQBr8GSX1x4c6m6gHaMW2nl4jzUDritskwbLwQwI/edit#heading=h.fx323geph920"
    },
    {
        name: "Formlabs Form 2 SLA",
        description: "SLA 3D printer that prints using a clear resin, allowing for extremely accurate, production-quality prints. Prints need to be washed in isopropal alcohol after printing. Resin is charged at-cost to the user.",
        image: "img/equipment/form2.webp",
        manual: "https://docs.google.com/document/d/1gDvmQBr8GSX1x4c6m6gHaMW2nl4jzUDritskwbLwQwI/edit#heading=h.vyczjolvr77i"
    },
    {
        name: "Formlabs Fuse SLS & Sifter",
        description: "SLS 3D printer that prints by fusing nylon powder together. This method allows for extremely intricate parts that don't need supports to be printed. SLS is charged at-cost to the user.",
        image: "img/equipment/fuse1.webp",
        manual: "https://docs.google.com/document/d/1gDvmQBr8GSX1x4c6m6gHaMW2nl4jzUDritskwbLwQwI/edit#heading=h.nldknjybpgtv"
    },
    {
        name: "Protomax Waterjet",
        description: "Waterjet cutter that can cut virtually any material. Uses a high-pressure stream of water to propel abrasive through the material.",
        image: "img/equipment/protomax.webp",
        manual: "https://docs.google.com/document/d/1a-hPM5qB79ONJ-7k06pvIZVxz1_ONLAD/edit#heading=h.q03evgbefekk"
    },
    {
        name: "Wazer Waterjet",
        description: "Waterjet cutter, with a larger bed and simplier interface then the Omax waterjet, but has a slower cutting speed.",
        image: "img/equipment/wazer.webp",
        manual: "https://docs.google.com/document/d/1a-hPM5qB79ONJ-7k06pvIZVxz1_ONLAD/edit#heading=h.4ruaft4f563k2"
    },
];

const electronic_benches_equipment = [
    {
        name: "Soldering Irons",
        description: "We have a variety of soldering irons available for use, along with solder, solder paste, solder wicks, iron cleaners, and more.",
        image: "img/equipment/solderingiron.webp",
        manual: ""
    },
    {
        name: "Handheld Multimeters",
        description: "We have a variety of handheld multimeters available for use, along with a variety of cables and connectors.",
        image: "img/equipment/handheldmultimeter.webp",
        manual: ""
    },
    {
        name: "Keysight Oscilloscopes",
        description: "Oscilloscopes are used to plot the frequency of various electrical signals.",
        image: "img/equipment/oscilloscope.webp",
        manual: ""
    },
    {
        name: "Keysight DC Power Supplies",
        description: "DC power supplies are used to supply specific, controllable amounts of power to DC circuits.",
        image: "img/equipment/powersupply.webp",
        manual: ""
    },
    {
        name: "Keysight Waveform Generators",
        description: "Waveform generators are used to generate a specific frequency or pattern of electrical signals.",
        image: "img/equipment/waveformgenerator.webp",
        manual: ""
    },
    {
        name: "Keysight Bench Multimeters",
        description: "Multimeters are used to measure the voltage and amperage in a circuit. This bench multimeter can't be moved around, but has more options and features than a traditional handheld multimeter",
        image: "img/equipment/benchmultimeter.webp",
        manual: ""
    },
];

const main_area_equipment = [
    {
        name: "Large Format Printer (Epson P8000)",
        description: "Large format printer that can print on matte and glossy paper. Loaded with roll paper up to 44 inches wide and 100 feet long. Ink and paper charged at-cost to the user.",
        image: "img/equipment/epsonp8000.webp",
        manual: "https://docs.google.com/document/d/140CBEPn0G9BJOiClJX6WaqFBji2eywQsaJNLDx3WKzw/edit"
    },
    {
        name: "Juki Leather Sewing Machine",
        description: "Our leather sewing machine is a Juki DNU-1541 Industrial Walking Foot Leather Sewing Machine. It can be used to sew through almost any thick material, such as leather or several layers of fabric.",
        image: "img/equipment/jukileather.webp",
        manual: "https://docs.google.com/document/d/1yd2rw5y6qqGc4TxY96SvBxB6GHxCRw89vDVzAFOLSls/edit"
    },
    {
        name: "Sewing Machines",
        description: "Various models of sewing machines are available for use, alongside a wide selection of thread colors, needles, and other sewing supplies.",
        image: "img/equipment/sewingmachine.webp",
        manual: "https://docs.google.com/document/d/1G9GU8GuiwsSYijOM1ZvY0uHSs9XidLDGd6vxzkiocqI/edit#heading=h.2oq61rhnhhsl"
    },
    {
        name: "Embroidery Machines",
        description: "The Brother PE800 can automatically embroider designs onto fabric. Embroidery designs can be designed on the machine for simple text and symbols, with more complex designs able to be created on a computer and transferred to the machine.",
        image: "img/equipment/embroiderymachine.webp",
        manual: "https://docs.google.com/document/d/1G9GU8GuiwsSYijOM1ZvY0uHSs9XidLDGd6vxzkiocqI/edit#heading=h.rf31xvk93cuq"
    },
    {
        name: "Digital Jacquard Loom",
        description: "The TC2 Digital Jacquard Loom can weave custom designs into fabric. Lots of different fibers can be used with the loom. The digital part means that a computer can control the heddles to create intricate patterns.",
        image: "img/equipment/loom.webp",
        manual: "https://docs.google.com/document/d/1T7UWdbl9iEGJ31fNZpCOMRPS3_PBd1ioztRqxQduCKY/edit"
    },
    {
        name: "Printing Press",
        description: "The Makerspace printing press (c. 1950) can print linoleum designs and type -- a great way to produce a vintage custom effect.",
        image: "img/equipment/printingpress.webp",
        manual: "https://docs.google.com/document/d/1qXLxTUifwV6mHEi45AyhBj6PTZoxPnDWk8Sk9bhQ9p4/edit#heading=h.c4g0pi9dhov7"
    },
    {
        name: "Cricut Machine",
        description: "The Cricut Explore Air 2 is a machine that can cut out designs from paper, vinyl, and other materials. It can also be used to draw and write on paper.",
        image: "img/equipment/cricut.webp",
        manual: "https://docs.google.com/document/d/1Wom5XbKVJKwy3peKGTlM5m1HFji67XZr2B0jyBUi5jk/edit"
    }
];

const studio_video_equipment = [
    {
        name: "Canon EOS C200 Cinema Camera",
        description: "The Canon EOS C200 is a 4K cinema camera that can be used for video production. It has a 8.85 Megapixel Super 35mm CMOS Sensor, and can be used with the included zoom lens or any of our prime lenses. Records to dual SD cards, and can be powered by battery or DC power.",
        image: "img/equipment/canoneosc200.webp",
        manual: ""
    },
    {
        name: "Nikon Z7II",
        description: "The Nikon Z7II is a full frame mirrorless camera that can be used for photography or videography. It has a 45.7 megapixel sensor, allowing for incredibly detailed photos, or 4K 60fps video recording.",
        image: "img/equipment/nikon.webp",
        manual: ""
    },
];

const studio_audio_equipment = [
];

const welding_area_equipment = [
    {
        name: "Miller Multimatic 215 Multiprocess Welder",
        description: "The Miller Multimatic 215 is a multiprocess welder that can be used to weld steel, aluminum, and stainless steel. It can be used to weld with MIG, Flux-Cored, Stick, and TIG processes. It can also be used to cut steel with an oxy-fuel torch.",
        image: "img/equipment/multimatic215.webp",
        manual: "https://docs.google.com/document/d/13k30JUPOOKK707lYuoaa8Pd3ICvUOBFMly4v8zQqU-Y/edit"
    }
];

const all_equipment = [
    {
        name: "Main Area & Cage",
        obj: main_area_equipment,
    },
    {
        name: "3D Printer & Laser Cutter Room",
        obj: laser3d_equipment,
    },
    {
        name: "Electronic Benches",
        obj: electronic_benches_equipment,
    },
    {
        name: "Studio (Video)",
        obj: studio_video_equipment,
    },
    {
        name: "Studio (Audio)",
        obj: studio_audio_equipment,
    },
    {
        name: "Welding Area",
        obj: welding_area_equipment,
    },
];

function renderEquipment() {
    const el = document.getElementById("equipment-content");

    for (let equipment of all_equipment) {
        el.appendChild(generateEquipmentDiv(equipment));
    }
}

function generateEquipmentDiv(equipment) {
    const equipment_div = document.createElement("div");
    equipment_div.classList.add("equipment");
    
    const name_div = document.createElement("div");
    name_div.classList.add("equipment-name");
    name_div.innerText = equipment.name;

    equipment_div.appendChild(name_div);

    const machines_div = document.createElement("div");
    machines_div.classList.add("equipment-machines");

    for (let machine of equipment.obj) {
        machines_div.appendChild(generateMachineDiv(machine));
    }

    equipment_div.appendChild(machines_div);

    return equipment_div;
}

function generateMachineDiv(machine) {
    const machine_div = document.createElement("div");
    machine_div.classList.add("machine");

    const image_div = document.createElement("div");
    image_div.classList.add("machine-image");
    image_div.style.backgroundImage = `url(${machine.image})`;

    const name_div = document.createElement("div");
    name_div.classList.add("machine-name");
    name_div.innerText = machine.name;

    const description_div = document.createElement("div");
    description_div.classList.add("machine-description");
    description_div.innerText = machine.description;

    machine_div.appendChild(image_div);
    machine_div.appendChild(name_div);
    machine_div.appendChild(description_div);

    if (machine.manual != "") {
        const manual_link_div = document.createElement("div");
        manual_link_div.classList.add("machine-manual");
        manual_link_div.innerHTML = `<button onclick="openInNewTab('${machine.manual}')">Open Manual</button>`;
        machine_div.appendChild(manual_link_div);
    }

    return machine_div;
            
}