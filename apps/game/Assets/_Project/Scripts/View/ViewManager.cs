using UnityEngine;
using System.Collections.Generic;

namespace Koconi.View
{
    public class ViewManager : MonoBehaviour
    {
        [SerializeField] private GameObject authPanel;
        [SerializeField] private GameObject homePanel;
        [SerializeField] private GameObject pinCreatePanel;
        [SerializeField] private GameObject pinDetailPanel;

        public void ShowAuth()
        {
            HideAll();
            authPanel.SetActive(true);
        }

        public void ShowHome()
        {
            HideAll();
            homePanel.SetActive(true);
        }

        public void ShowPinCreate()
        {
            // Overlay or separate screen
            pinCreatePanel.SetActive(true);
        }

        public void ShowPinDetail()
        {
             pinDetailPanel.SetActive(true);
        }

        private void HideAll()
        {
            authPanel.SetActive(false);
            homePanel.SetActive(false);
            pinCreatePanel.SetActive(false);
            pinDetailPanel.SetActive(false);
        }
    }
}
