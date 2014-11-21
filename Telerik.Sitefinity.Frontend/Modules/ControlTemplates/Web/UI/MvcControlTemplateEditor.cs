﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;
using System.Web.UI;
using Telerik.Sitefinity.Frontend.Mvc.Infrastructure.Controllers;
using Telerik.Sitefinity.Modules.ControlTemplates.Web.UI;

namespace Telerik.Sitefinity.Frontend.Modules.ControlTemplates.Web.UI
{
    /// <summary>
    /// Override the original control template editor for Mvc based widgets
    /// </summary>
    internal class MvcControlTemplateEditor : ControlTemplateEditor
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="MvcControlTemplateEditor" /> class.
        /// </summary>
        public MvcControlTemplateEditor() : base()
        {
        }

        /// <inheritdoc/>
        public override string ClientComponentType
        {
            get
            {
                return typeof(MvcControlTemplateEditor).FullName;
            }
        }

        /// <inheritdoc/>
        public override IEnumerable<ScriptReference> GetScriptReferences()
        {
            var scripts = new List<ScriptReference>(base.GetScriptReferences());

            scripts.Add(new ScriptReference(MvcControlTemplateEditor.MvcControlTemplateEditorScript, typeof(MvcControlTemplateEditor).Assembly.FullName));

            return scripts;
        }

        /// <summary>
        /// Gets Mvc controllers fullnames for current Templatable Controls.
        /// </summary>
        /// <returns>List of <see cref="ScriptDescriptor"/>.</returns>
        public override IEnumerable<ScriptDescriptor> GetScriptDescriptors()
        {
            var descriptor = (ScriptComponentDescriptor)base.GetScriptDescriptors().Last();

            var mvcTypesFullNames = Telerik.Sitefinity.Modules.ControlTemplates.ControlTemplates.GetTemplatableControls()
                .Where(c => c.Value != null && c.Value.DataItemType != null)
                .Where(c => FrontendManager.ControllerFactory.IsController(c.Value.DataItemType))
                .Select(c => c.Value.DataItemType.FullName);

            descriptor.AddProperty("mvcTypes", new JavaScriptSerializer().Serialize(mvcTypesFullNames));

            return new ScriptDescriptor[] { descriptor };
        }

        private const string MvcControlTemplateEditorScript = "Telerik.Sitefinity.Frontend.Modules.ControlTemplates.Web.Scripts.MvcControlTemplateEditor.js";
    }
}
