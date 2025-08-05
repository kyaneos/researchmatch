// This file contains the research groups data as a JavaScript module to avoid CORS issues
export const researchGroupsData = {
  "universities": [
    {
      "name": "Massachusetts Institute of Technology",
      "location": "Cambridge, MA",
      "departments": [
        {
          "name": "Computer Science and Artificial Intelligence Laboratory (CSAIL)",
          "labs": [
            {
              "name": "Distributed Robotics Lab",
              "pi": "Prof. Daniela Rus",
              "research_focus": "Swarm robotics, autonomous systems",
              "size": 25,
              "funding": "High",
              "publications_per_year": 45
            },
            {
              "name": "Computer Vision Group",
              "pi": "Prof. Antonio Torralba",
              "research_focus": "Computer vision, machine learning",
              "size": 30,
              "funding": "High",
              "publications_per_year": 52
            }
          ]
        },
        {
          "name": "Department of Physics",
          "labs": [
            {
              "name": "Center for Theoretical Physics",
              "pi": "Prof. Frank Wilczek",
              "research_focus": "Theoretical physics, quantum field theory",
              "size": 40,
              "funding": "High",
              "publications_per_year": 68
            }
          ]
        }
      ]
    },
    {
      "name": "Stanford University",
      "location": "Stanford, CA",
      "departments": [
        {
          "name": "Computer Science Department",
          "labs": [
            {
              "name": "Stanford AI Lab (SAIL)",
              "pi": "Prof. Fei-Fei Li",
              "research_focus": "Artificial intelligence, computer vision",
              "size": 50,
              "funding": "Very High",
              "publications_per_year": 78
            },
            {
              "name": "Human-Computer Interaction Group",
              "pi": "Prof. Terry Winograd",
              "research_focus": "HCI, user interface design",
              "size": 20,
              "funding": "Medium",
              "publications_per_year": 32
            }
          ]
        }
      ]
    },
    {
      "name": "Harvard University",
      "location": "Cambridge, MA",
      "departments": [
        {
          "name": "School of Engineering and Applied Sciences",
          "labs": [
            {
              "name": "Wyss Institute",
              "pi": "Prof. Donald Ingber",
              "research_focus": "Bioinspired engineering, medical devices",
              "size": 60,
              "funding": "Very High",
              "publications_per_year": 85
            }
          ]
        }
      ]
    }
  ]
};